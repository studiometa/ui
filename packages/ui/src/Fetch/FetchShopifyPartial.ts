import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import {
  FETCH_EVENTS,
  Fetch,
  HEADER_NAMES,
  headerNames,
  type FetchEmits,
  type FetchLifecycleDetail,
  type FetchProps,
  type FetchRequestContext,
} from './Fetch.js';

/** Minimal shape of the `partials` API exposed by `@shopify/partial-rendering`. */
interface PartialsApi {
  fetch(
    ...args: [...names: string[], options: { url: string; signal?: AbortSignal }]
  ): Promise<unknown>;
  apply(update: unknown): void | Promise<void>;
}

/** Minimal shape of the `@shopify/partial-rendering` module. */
interface PartialsModule {
  partials: PartialsApi;
}

export type FetchShopifyPartialProps = FetchProps & {
  $options: FetchProps['$options'] & { partials: string };

  /**
   * Every event of the partial rendering path also carries the opaque update
   * object `partials.apply()` consumes. It is the only part of that path's
   * detail that is not plain data, and it stands where the base carries the
   * `content` string and the parsed `fragment`, neither of which exists here.
   */
  $emits: { [K in keyof FetchEmits]: FetchEmits[K] & { update?: unknown } };
};

/**
 * Adapts {@link Fetch} to Shopify's `@shopify/partial-rendering` API (Liquid
 * July '26 preview). Partial rendering engages only when partial names are
 * configured via the `partials` option **and** the preview package
 * resolves; otherwise it transparently falls back to the base {@link Fetch}
 * behaviour (id-based full-page swap).
 *
 * Compared to the base lifecycle, the partials path diverges in two ways:
 * the `RESPONSE` event never fires (there is no `Response` object on this
 * path, so no `response` description either), and the payload carries the
 * opaque partials `update` object where the base carries `content` and a
 * parsed `fragment` — `partials.apply` owns DOM swapping, View Transitions
 * and focus/selection/form/scroll preservation.
 *
 * @link https://ui.studiometa.dev/reference/items/Fetch/
 */
export class FetchShopifyPartial<T extends BaseProps = BaseProps> extends Fetch<
  FetchShopifyPartialProps & T
> {
  static config: BaseConfig = {
    name: 'FetchShopifyPartial',
    options: {
      partials: String,
    },
  };

  /**
   * Module specifier for the Shopify partial rendering package. A static
   * field, not a module constant like {@link FETCH_EVENTS}: this one exists
   * to be overridden, by a test or a subclass, so it keeps the shape a
   * `this.constructor` access needs.
   */
  static PARTIALS_MODULE = '@shopify/partial-rendering';

  /**
   * Load the Shopify partial rendering module, lazily so the class compiles
   * and runs without the preview package installed. Override on a subclass
   * or reassign directly (`FetchShopifyPartial.loadPartialsModule = …`) to
   * inject a fake.
   */
  static async loadPartialsModule(): Promise<PartialsModule> {
    // Through `unknown`: a dynamic import of a non-literal specifier is `any`,
    // and the shape is asserted rather than known — `resolvePartials()` is what
    // turns a module that does not match into a `null` fallback.
    const loaded: unknown = await import(/* @vite-ignore */ this.PARTIALS_MODULE);
    return loaded as PartialsModule;
  }

  /** `undefined` means resolution has not been attempted yet, `null` means it failed. */
  partialsModule: PartialsApi | null | undefined;

  /** The configured partial names, trimmed and empty-filtered. */
  get partialNames(): string[] {
    return this.$options.partials
      .split(',')
      .map((partial) => partial.trim())
      .filter(Boolean);
  }

  /**
   * Resolve the partials API, memoising the result. Returns `null` on any
   * failure (missing package, missing export, …) so callers fall back to
   * the base behaviour. This never rejects.
   */
  async resolvePartials(): Promise<PartialsApi | null> {
    if (typeof this.partialsModule !== 'undefined') {
      return this.partialsModule;
    }

    try {
      const ctor = this.constructor as typeof FetchShopifyPartial;
      const loaded = await ctor.loadPartialsModule();
      this.partialsModule = loaded?.partials ?? null;
    } catch {
      this.partialsModule = null;
    }

    return this.partialsModule;
  }

  /**
   * Whether the given request can be expressed through the partials API.
   *
   * `@shopify/partial-rendering` only performs a GET for a URL — it takes
   * nothing but `{ url, signal }` — so a request carrying a body, a
   * non-GET method, custom headers or any other `RequestInit` field falls
   * back to the base {@link Fetch} behaviour, whether these come from the
   * element options or from the per-call `requestInit` argument.
   * Framework-internal headers are ignored, so the declarative click,
   * submit and popstate flows still use partial rendering.
   */
  canUsePartials(requestInit: RequestInit, context: FetchRequestContext = {}): boolean {
    // Built from the same context as the request itself: a submitter's
    // `formmethod="post"` makes the request unexpressible, and reading a
    // context-free `requestInit` would miss it.
    const elementRequestInit = this.__buildRequestInit(context);
    const method = requestInit.method ?? elementRequestInit.method ?? 'get';

    if (method.toLowerCase() !== 'get' || requestInit.body || elementRequestInit.body) {
      return false;
    }

    const supportedKeys = new Set(['method', 'headers', 'body', 'signal']);
    for (const key of Object.keys({ ...this.$options.requestInit, ...requestInit })) {
      if (!supportedKeys.has(key)) {
        return false;
      }
    }

    const internalHeaders = new Set<string>(Object.values(HEADER_NAMES));
    const declared = [
      ...headerNames(elementRequestInit.headers),
      ...headerNames(requestInit.headers),
    ];
    for (const header of declared) {
      if (!internalHeaders.has(header)) {
        return false;
      }
    }

    return true;
  }

  /** Fetch via Shopify partial rendering when configured, otherwise fall back to the base behaviour. */
  async fetch(
    url?: URL | string,
    requestInit: RequestInit = {},
    context: FetchRequestContext = {},
  ): Promise<void> {
    // Same reading as the base: an absent URL is the element's own
    // navigation, which is what lets `historyUrl` differ from the requested
    // one. The fallback path is handed the same absence, not a resolved URL.
    const fromElement = url === undefined;
    const normalizedUrl = fromElement
      ? this.__buildUrl(context)
      : url instanceof URL
        ? url
        : new URL(url, window.location.href);
    const names = this.partialNames;
    const partials =
      names.length && this.canUsePartials(requestInit, context)
        ? await this.resolvePartials()
        : null;

    if (!partials) {
      return super.fetch(fromElement ? undefined : normalizedUrl, requestInit, context);
    }

    this.__historyUrl = fromElement ? this.__buildHistoryUrl(context) : undefined;

    // Same ordering as the base: the controller is built first so the request
    // is fully described by the time `fetch-before` announces it, and the
    // previous request is aborted after that event.
    const newController = new AbortController();
    const init = this.mergeRequestInit(requestInit, newController.signal, context);
    const detail: FetchLifecycleDetail = {
      instance: this,
      request: this.__requestDetail(normalizedUrl, init),
    };

    this.$emit(FETCH_EVENTS.BEFORE_FETCH, detail);

    this.__abortController.abort();
    newController.signal.addEventListener('abort', () => {
      this.$emit(FETCH_EVENTS.ABORT, { ...detail, reason: newController.signal.reason });
    });
    this.__abortController = newController;

    this.$emit(FETCH_EVENTS.FETCH, detail);

    let update: unknown;

    try {
      update = await partials.fetch(...names, {
        url: normalizedUrl.toString(),
        signal: init.signal ?? undefined,
      });
      this.$emit(FETCH_EVENTS.AFTER_FETCH, { ...detail, update });
    } catch (error) {
      this.$emit(FETCH_EVENTS.AFTER_FETCH, { ...detail, error });
      this.error(normalizedUrl, init, error as Error);
      return;
    }

    // Awaited, as the base awaits its own update: `fetch()` resolves once the
    // Shopify swap has settled. It is caught on its own rather than inside the
    // block above, or a failed apply would emit a second `fetch-after` and
    // report itself as a failed request.
    try {
      await this.applyPartials(normalizedUrl, init, update, partials);
    } catch (applyError) {
      this.error(normalizedUrl, init, applyError as Error);
    }
  }

  /**
   * Apply the partials update to the DOM. Kept separate from the base
   * {@link Fetch.update}, which is still used verbatim on the fallback
   * path: on the partials path, `partials.apply` owns DOM swapping, View
   * Transitions and focus/selection/form/scroll preservation, so no
   * fragment parsing happens here.
   */
  async applyPartials(
    url: URL,
    requestInit: RequestInit,
    update: unknown,
    partials: PartialsApi,
  ): Promise<void> {
    const detail = {
      instance: this,
      request: this.__requestDetail(url, requestInit),
      update,
    };

    this.$emit(FETCH_EVENTS.BEFORE_UPDATE, detail);

    this.__updateHistory(url, requestInit);

    this.$emit(FETCH_EVENTS.UPDATE, detail);

    await partials.apply(update);

    this.$emit(FETCH_EVENTS.AFTER_UPDATE, detail);
  }
}
