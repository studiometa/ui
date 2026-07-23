import { type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import { Fetch, type FetchProps } from './Fetch.js';

export interface FetchShopifySectionProps extends FetchProps {
  $options: FetchProps['$options'] & {
    sections: string[];
  };
}

export type FetchShopifySectionConstructor<
  T extends FetchShopifySection = FetchShopifySection,
> = {
  new (...args: any[]): T;
  prototype: FetchShopifySection;
} & Pick<typeof FetchShopifySection, keyof typeof FetchShopifySection>;

/**
 * FetchShopifySection class.
 *
 * Adapts the base {@link Fetch} component to Shopify's stable
 * [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering). The section IDs
 * to refresh are declared through the `sections` option instead of being baked into the URL, so
 * the element's own `href`/`action` stays a clean, no-JS fallback: the `sections` parameter is
 * appended to the request URL only when JavaScript runs, and it is kept out of the URL pushed to
 * the history. The JSON response (`{ [id]: html }`) is unwrapped by the default `response` option
 * and each section is swapped in place by the inherited `[id]` selector — no per-element
 * `response` boilerplate required.
 *
 * @link https://ui.studiometa.dev/components/FetchShopifySection/
 */
export class FetchShopifySection<T extends BaseProps = BaseProps> extends Fetch<
  T & { $options: { sections: string[] } }
> {
  /**
   * Declare the `this.constructor` type
   * @link https://github.com/microsoft/TypeScript/issues/3841#issuecomment-2381594311
   */
  declare ['constructor']: FetchShopifySectionConstructor;

  /**
   * The Section Rendering API query parameter name.
   */
  static SECTIONS_PARAMETER = 'sections';

  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Fetch.config,
    name: 'FetchShopifySection',
    options: {
      ...Fetch.config.options,
      sections: Array,
      response: {
        type: String,
        default:
          "response.json().then((sections) => Object.values(sections).filter(Boolean).join(''))",
      },
    },
  };

  /**
   * The request URL with the configured section IDs appended as the Section Rendering API
   * `sections` parameter, leaving the element's own `href`/`action` untouched.
   */
  get url(): URL {
    const url = super.url;
    const { sections } = this.$options;

    if (sections.length) {
      url.searchParams.set(this.constructor.SECTIONS_PARAMETER, sections.join(','));
    }

    return url;
  }

  /**
   * Strip the `sections` parameter before the base update so the URL pushed to the history is
   * the human-facing page, not the raw Section Rendering endpoint.
   * @inheritdoc
   */
  update(url: URL, requestInit: RequestInit, content: string) {
    const displayUrl = new URL(url);
    displayUrl.searchParams.delete(this.constructor.SECTIONS_PARAMETER);
    return super.update(displayUrl, requestInit, content);
  }
}
