import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Fetch, type FetchProps, type FetchRequest, type RestoreRecipe } from './Fetch.js';

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
 * The section IDs are declared through the `sections` option, which adds the
 * `sections` query parameter to every request. The element's own `href` or
 * `action` stays a clean, no-JS fallback, and the address bar never shows the
 * parameter, because history records the destination and not the request
 * URL. The JSON response (`{ [id]: html }`) is unwrapped by
 * {@link parseResponse}, and each section is swapped in place by the
 * inherited `[id]` selector. With no `sections` configured the component
 * degrades to the base {@link Fetch} behaviour.
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

  /**
   * The section IDs as the `sections` query parameter, so every request built
   * from a destination asks for them, restores and `formaction` submissions
   * included.
   *
   * @protected
   */
  get __transportParams(): Record<string, string> {
    const { sectionIds } = this;
    return sectionIds.length ? { [SECTIONS_PARAMETER]: sectionIds.join(',') } : {};
  }

  /**
   * Unwrap the Section Rendering JSON response (`{ [id]: html }`) into one HTML
   * string, dropping sections returned as `null`.
   *
   * Skipped — deferring to the base implementation, which evaluates the
   * `response` expression — when the request asks for no sections, or when
   * the recipe carries its own `response` expression.
   *
   * @protected
   */
  async parseResponse(
    response: Response,
    request: FetchRequest,
    recipe: RestoreRecipe,
  ): Promise<unknown> {
    if (!recipe.params[SECTIONS_PARAMETER] || recipe.response !== DEFAULT_RESPONSE) {
      return super.parseResponse(response, request, recipe);
    }

    const parsed = (await response.json()) as Record<string, string | null>;
    return Object.values(parsed).filter(Boolean).join('');
  }
}
