import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Fetch, type FetchProps, type FetchRequestContext } from './Fetch.js';

/** The Section Rendering API query parameter name. */
export const SECTIONS_PARAMETER = 'sections';

/** The `response` option value the base class ships, and the one this replaces. */
const DEFAULT_RESPONSE = (Fetch.config.options as Record<string, { default: string }>).response
  .default;

export type FetchShopifySectionProps = FetchProps & {
  $options: FetchProps['$options'] & {
    sections: string;
  };
};

/**
 * Adapts {@link Fetch} to Shopify's
 * [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering).
 *
 * The section IDs are declared through the `sections` option instead of being
 * baked into the URL, so the element's own `href`/`action` stays a clean,
 * no-JS fallback. The JSON response (`{ [id]: html }`) is unwrapped by
 * {@link parseResponse} and each section is swapped in place by the inherited
 * `[id]` selector. With no `sections` configured the component degrades to the
 * base {@link Fetch} behaviour.
 *
 * @link https://ui.studiometa.dev/reference/items/FetchShopifySection/
 */
export class FetchShopifySection<T extends BaseProps = BaseProps> extends Fetch<
  FetchShopifySectionProps & T
> {
  /**
   * The config does not spread `Fetch.config`: configs merge along the
   * prototype chain (#627), so only what this class adds is stated.
   */
  static config: BaseConfig = {
    name: 'FetchShopifySection',
    options: {
      sections: String,
    },
  };

  /** The configured section IDs, trimmed and empty-filtered. */
  get sectionIds(): string[] {
    return this.$options.sections
      .split(',')
      .map((section) => section.trim())
      .filter(Boolean);
  }

  /** Append the configured section IDs, leaving the URL otherwise untouched. */
  /** @protected */
  __appendSections(url: URL): URL {
    const { sectionIds } = this;

    if (sectionIds.length) {
      url.searchParams.set(SECTIONS_PARAMETER, sectionIds.join(','));
    }

    return url;
  }

  /**
   * Appending here rather than on the `url` getter puts the sections on every
   * URL the element resolves for itself — the click, the submit and the
   * popstate replay alike — since they all build their URL from this one
   * method. The getter inherits it.
   *
   * @protected
   */
  __buildUrl(context: FetchRequestContext): URL {
    return this.__appendSections(super.__buildUrl(context));
  }

  /** Ensure the `sections` parameter is on a URL a caller named too. */
  fetch(
    url?: URL | string,
    requestInit: RequestInit = {},
    context: FetchRequestContext = {},
  ): Promise<void> {
    // An absent URL is forwarded as absent, so the base still reads this as
    // the element's own navigation and pushes `historyUrl` rather than the
    // requested URL. That path resolves through `__buildUrl()` above, which
    // appends the sections already.
    if (url === undefined) {
      return super.fetch(undefined, requestInit, context);
    }

    const normalizedUrl = url instanceof URL ? url : new URL(url, window.location.href);
    return super.fetch(this.__appendSections(normalizedUrl), requestInit, context);
  }

  /**
   * Unwrap the Section Rendering JSON response (`{ [id]: html }`) into one HTML
   * string, dropping sections returned as `null`.
   *
   * Skipped — deferring to the base implementation, which evaluates the
   * `response` option — when no sections are configured, or when the caller
   * supplied their own `response` option.
   */
  async parseResponse(response: Response, url: URL, requestInit: RequestInit): Promise<string> {
    const { response: responseOption } = this.$options;

    if (!this.sectionIds.length || responseOption !== DEFAULT_RESPONSE) {
      return super.parseResponse(response, url, requestInit);
    }

    const parsed = (await response.json()) as Record<string, string | null>;
    return Object.values(parsed).filter(Boolean).join('');
  }

  /**
   * Strip the `sections` parameter before the base update, so the URL pushed
   * to the history is the human-facing page and not the raw endpoint.
   */
  update(url: URL, requestInit: RequestInit, content: string): Promise<void> {
    const displayUrl = new URL(url);
    displayUrl.searchParams.delete(SECTIONS_PARAMETER);
    return super.update(displayUrl, requestInit, content);
  }
}
