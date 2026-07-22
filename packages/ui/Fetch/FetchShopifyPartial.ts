import { type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import { historyPush } from '@studiometa/js-toolkit/utils';
import { Fetch, type FetchProps } from './Fetch.js';

export interface FetchShopifyPartialProps extends FetchProps {
  $options: FetchProps['$options'] & {
    partials: string[];
  };
}

export type FetchShopifyPartialConstructor<
  T extends FetchShopifyPartial = FetchShopifyPartial,
> = {
  new (...args: any[]): T;
  prototype: FetchShopifyPartial;
} & Pick<typeof FetchShopifyPartial, keyof typeof FetchShopifyPartial>;

/**
 * Minimal shape of the `partials` API exposed by `@shopify/partial-rendering`.
 * @internal
 */
interface PartialsApi {
  fetch(...args: [...names: string[], options: { url: string; signal?: AbortSignal }]): Promise<unknown>;
  apply(update: unknown): void | Promise<void>;
}

/**
 * Minimal shape of the `@shopify/partial-rendering` module.
 * @internal
 */
interface PartialsModule {
  partials: PartialsApi;
}

/**
 * FetchShopifyPartial class.
 *
 * Adapts the base {@link Fetch} component to Shopify's `@shopify/partial-rendering` API
 * (Liquid July '26 preview). Shopify partial rendering is engaged only when partial names
 * are configured via the `partials` option AND the preview package resolves; otherwise it
 * transparently falls back to the base {@link Fetch} behaviour (id-based full-page swap).
 *
 * Compared to the base {@link Fetch} lifecycle, the partials path diverges in two ways:
 * - the `RESPONSE` event is never emitted, as there is no `Response` object on this path;
 * - the `UPDATE` event payload carries the opaque partials `update` object instead of a
 *   parsed `Document` fragment, and `partials.apply` owns DOM swapping, View Transitions
 *   and focus/selection/form/scroll preservation.
 *
 * @link https://ui.studiometa.dev/components/Fetch/
 */
export class FetchShopifyPartial<T extends BaseProps = BaseProps> extends Fetch<
  T & { $options: { partials: string[] } }
> {
  /**
   * Declare the `this.constructor` type
   * @link https://github.com/microsoft/TypeScript/issues/3841#issuecomment-2381594311
   */
  declare ['constructor']: FetchShopifyPartialConstructor;

  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Fetch.config,
    name: 'FetchShopifyPartial',
    options: {
      ...Fetch.config.options,
      partials: Array,
    },
  };

  /**
   * Module specifier for the Shopify partial rendering package.
   *
   * Exposed as a static field so tests can override {@link __loadPartialsModule} without
   * relying on the preview package being installed.
   */
  static __PARTIALS_MODULE = '@shopify/partial-rendering';

  /**
   * Load the Shopify partial rendering module.
   *
   * The package is imported lazily via a dynamic import so the module compiles and runs
   * without the preview package being installed. Override this in tests to inject a fake.
   * @protected
   */
  static async __loadPartialsModule(): Promise<PartialsModule> {
    return import(this.__PARTIALS_MODULE);
  }

  /**
   * Cached partials API resolution.
   *
   * `undefined` means resolution has not been attempted yet, `null` means it failed.
   * @internal
   */
  __partialsModule: PartialsApi | null | undefined;

  /**
   * Resolve the partials API, memoising the result.
   *
   * Returns `null` on any failure (missing package, missing export, ...) so callers can
   * transparently fall back to the base behaviour. This never rejects.
   * @protected
   */
  async __resolvePartials(): Promise<PartialsApi | null> {
    if (typeof this.__partialsModule !== 'undefined') {
      return this.__partialsModule;
    }

    try {
      const module = await this.constructor.__loadPartialsModule();
      this.__partialsModule = module?.partials ?? null;
    } catch {
      this.__partialsModule = null;
    }

    return this.__partialsModule;
  }

  /**
   * Whether the given request can be expressed through the partials API.
   *
   * The `@shopify/partial-rendering` API only performs a GET for the given URL (it receives
   * nothing but `{ url, signal }`), so a request that carries a body, a non-GET method,
   * custom headers or any other `RequestInit` field falls back to the base {@link Fetch}
   * behaviour to preserve its contract — whether these come from the element options
   * (a `method="post"` form, `data-option-headers`, `data-option-request-init`) or from the
   * per-call `requestInit` argument (for example `fetch(url, { credentials: 'include' })`).
   * Framework-internal headers (see {@link Fetch.__headerNames}) are ignored, so the
   * declarative click, submit and popstate flows still use partial rendering.
   * @protected
   */
  __canUsePartials(requestInit: RequestInit): boolean {
    const merged = {
      ...this.requestInit,
      ...requestInit,
      headers: {
        ...this.requestInit.headers,
        ...requestInit.headers,
      },
    };

    if ((merged.method ?? 'get').toLowerCase() !== 'get' || merged.body) {
      return false;
    }

    const supportedKeys = new Set(['method', 'headers', 'body', 'signal']);
    for (const key of Object.keys({ ...this.$options.requestInit, ...requestInit })) {
      if (!supportedKeys.has(key)) {
        return false;
      }
    }

    const internalHeaders = new Set<string>(Object.values(this.__headerNames));
    for (const header of Object.keys(merged.headers)) {
      if (!internalHeaders.has(header.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Fetch given url via Shopify partial rendering when configured, otherwise fall back to
   * the base fetch behaviour.
   * @inheritdoc
   */
  async fetch(url: URL | string = this.url, requestInit: RequestInit = {}) {
    const normalizedUrl = url instanceof URL ? url : new URL(url, window.location.href);
    const names = this.$options.partials;
    const partials =
      names.length && this.__canUsePartials(requestInit) ? await this.__resolvePartials() : null;

    if (!partials) {
      return super.fetch(normalizedUrl, requestInit);
    }

    const { FETCH_EVENTS } = this.constructor;
    this.$emit(FETCH_EVENTS.BEFORE_FETCH, { instance: this, url: normalizedUrl, requestInit });

    this.__abortController.abort();
    const newController = new AbortController();
    newController.signal.addEventListener('abort', () => {
      this.$emit(FETCH_EVENTS.ABORT, {
        instance: this,
        url: normalizedUrl,
        requestInit,
        reason: newController.signal.reason,
      });
    });
    this.__abortController = newController;
    const init = {
      ...this.requestInit,
      ...requestInit,
      headers: {
        ...this.requestInit.headers,
        ...requestInit.headers,
      },
      signal: newController.signal,
    };

    this.$log('fetch', normalizedUrl, init);
    this.$emit(FETCH_EVENTS.FETCH, { instance: this, url: normalizedUrl, requestInit: init });

    try {
      const update = await partials.fetch(...names, {
        url: normalizedUrl.toString(),
        signal: init.signal,
      });
      this.$emit(FETCH_EVENTS.AFTER_FETCH, {
        instance: this,
        url: normalizedUrl,
        requestInit: init,
        content: update,
      });
      // Fire-and-forget the apply phase, matching the base `Fetch.fetch` lifecycle: an
      // `apply()` failure must not be misattributed to the fetch phase and re-emit
      // `AFTER_FETCH` a second time.
      this.__applyPartials(normalizedUrl, init, update, partials);
    } catch (error) {
      this.$emit(FETCH_EVENTS.AFTER_FETCH, {
        instance: this,
        url: normalizedUrl,
        requestInit: init,
        error,
      });
      this.error(normalizedUrl, init, error);
    }
  }

  /**
   * Apply the partials update to the DOM.
   *
   * This is intentionally kept separate from the base {@link Fetch.update}: the base method
   * is still used verbatim on the fallback path, where it parses an HTML string into a
   * `Document` fragment and performs the id-based full-page swap. On the partials path,
   * `partials.apply` owns DOM swapping, View Transitions and focus/selection/form/scroll
   * preservation, so no fragment parsing nor `__updateDOM`/`startViewTransition` happens here.
   * @protected
   */
  async __applyPartials(url: URL, requestInit: RequestInit, update: unknown, partials: PartialsApi) {
    const { FETCH_EVENTS } = this.constructor;
    const { history } = this.$options;

    this.$log('content', url, update);
    this.$emit(FETCH_EVENTS.BEFORE_UPDATE, { instance: this, url, requestInit, content: update });

    if (history) {
      if (requestInit?.headers?.[this.__headerNames.X_TRIGGERED_BY] !== 'popstate') {
        historyPush({ path: url.pathname, search: url.searchParams });
      }
    }

    this.$emit(FETCH_EVENTS.UPDATE, { instance: this, url, requestInit, update });

    await partials.apply(update);

    this.$emit(FETCH_EVENTS.AFTER_UPDATE, { instance: this, url, requestInit, update });
  }
}
