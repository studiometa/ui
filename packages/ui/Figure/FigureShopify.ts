import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractFigureDynamic } from './AbstractFigureDynamic.js';
import { normalizeSize } from './utils.js';

export interface FigureShopifyProps extends BaseProps {
  $options: {
    crop?: 'top' | 'left' | 'right' | 'bottom' | 'center';
  };
}

/**
 * Figure class.
 *
 * Manager lazyloading image sources.
 */
export class FigureShopify<T extends BaseProps = BaseProps> extends AbstractFigureDynamic<
  T & FigureShopifyProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractFigureDynamic.config,
    name: 'FigureShopify',
    options: {
      ...AbstractFigureDynamic.config.options,
      crop: {
        type: String,
        default: null,
      },
    },
  };

  /**
   * Format the source for Shopify CDN API.
   * @link https://shopify.dev/docs/api/liquid/filters/image_url
   */
  formatSrc(src: string): string {
    const { crop, step } = this.$options;

    const url = new URL(src, 'https://localhost');
    const width = normalizeSize(this.$refs.img.offsetWidth, step) * window.devicePixelRatio;
    const height = normalizeSize(this.$refs.img.offsetHeight, step) * window.devicePixelRatio;

    url.searchParams.set('width', String(width));
    url.searchParams.set('height', String(height));

    if (crop) {
      url.searchParams.set('crop', this.$options.crop);
    }

    return url.toString();
  }
}
