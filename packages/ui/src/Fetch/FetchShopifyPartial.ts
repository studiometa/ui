import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import {
  Fetch,
  HEADER_NAMES,
  type FetchLoadResult,
  type FetchProps,
  type FetchRequest,
  type RestoreRecipe,
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
};

/** The headers the component sends on its own behalf, which partials ignore. */
const INTERNAL_HEADERS = new Set<string>(Object.values(HEADER_NAMES));

/**
 * The updates loaded through partials, and the API that applies each one.
 * Content loaded by the inherited transport is a string and never lands here.
 */
const partialUpdates = new WeakMap<object, PartialsApi>();

/** The configured partial names, trimmed and empty-filtered. */
function partialNames(partials: unknown): string[] {
  return String(partials ?? '')
    .split(',')
    .map((partial) => partial.trim())
    .filter(Boolean);
}

/**
 * Adapts {@link Fetch} to Shopify's `@shopify/partial-rendering` API (Liquid
 * July '26 preview). Partial rendering engages only when partial names are
 * configured via the `partials` option **and** the preview package
 * resolves; otherwise it transparently falls back to the inherited
 * {@link Fetch} transport (id-based full-page swap).
 *
 * It changes two steps of the inherited lifecycle and nothing else:
 * {@link __load} asks `partials.fetch()` for the update, and {@link __apply}
 * hands it to `partials.apply()`, which owns DOM swapping, view transitions
 * and focus, selection, form and scroll preservation. On this path there is
 * no `Response`, so `fetch-response` is not emitted, and the opaque update is
 * the `content` of `fetch-update-before`.
 *
 * @link https://ui.studiometa.dev/reference/items/FetchShopifyPartial/
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
   * field, not a module constant like `FETCH_EVENTS`: this one exists
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
    return partialNames(this.$options.partials);
  }

  /**
   * The inherited recipe, with the partial names, so a restore with no live
   * owner still loads through partials.
   *
   * @protected
   */
  get __recipe(): RestoreRecipe {
    return { ...super.__recipe, partials: this.$options.partials };
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
   * Whether the final request, after `fetch-before`, can be sent through the
   * partials API.
   *
   * `@shopify/partial-rendering` only performs a GET for a URL — it takes
   * nothing but `{ url, signal }` — so a request with a body, another method,
   * a header that the component does not send on its own behalf, or a
   * `requestInit` key other than `headers` uses the inherited transport.
   *
   * @private
   */
  __isPartialsRequest(request: FetchRequest): boolean {
    if (request.method !== 'GET' || request.body !== undefined) {
      return false;
    }

    if (Object.keys(this.$options.requestInit).some((key) => key !== 'headers')) {
      return false;
    }

    return Object.keys(request.headers).every((name) => INTERNAL_HEADERS.has(name));
  }

  /**
   * Load the update through partials when the recipe names partials, the
   * request allows it and the module resolves; otherwise use the inherited
   * transport.
   *
   * @protected
   */
  async __load(
    request: FetchRequest,
    signal: AbortSignal,
    recipe: RestoreRecipe,
  ): Promise<FetchLoadResult> {
    const names = partialNames(recipe.partials);
    const partials =
      names.length && this.__isPartialsRequest(request) ? await this.resolvePartials() : null;

    if (!partials) {
      return super.__load(request, signal, recipe);
    }

    const update = await partials.fetch(...names, { url: request.url, signal });

    if (update && typeof update === 'object') {
      partialUpdates.set(update, partials);
    }

    // `partials.apply()` runs its own view transition.
    return { content: update, viewTransition: false };
  }

  /**
   * Apply a partials update with `partials.apply()`, and any other content
   * with the inherited swap.
   *
   * @protected
   */
  async __apply(content: unknown, recipe: RestoreRecipe): Promise<Document | undefined> {
    const partials =
      content && typeof content === 'object' ? partialUpdates.get(content) : undefined;

    if (!partials) {
      return super.__apply(content, recipe);
    }

    await partials.apply(content);
    return undefined;
  }
}
