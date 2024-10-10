import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import {
  withLeadingSlash,
  withoutLeadingSlash,
  withoutTrailingSlash,
} from '@studiometa/js-toolkit/utils';
import { Figure } from './Figure.js';
import { loadImage, normalizeSize } from './utils.js';

export interface FigureShopifyProps extends BaseProps {
  $options: {
    step: number;
    crop?: 'top' | 'left' | 'right' | 'bottom' | 'center';
  };
}

/**
 * Figure class.
 *
 * Manager lazyloading image sources.
 */
export class FigureShopify<T extends BaseProps = BaseProps> extends Figure<T & FigureShopifyProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Figure.config,
    name: 'FigureShopify',
    options: {
      ...Figure.config.options,
      disable: Boolean,
      step: {
        type: Number,
        default: 50,
      },
      crop: {
        type: String,
        default: null,
      },
    },
  };

  /**
   * Get the formatted source or the original based on the `disable` option.
   */
  get original() {
    return this.$options.disable ? super.original : this.formatSrc(super.original);
  }

  /**
   * Format the source for Shopify CDN API.
   * @see https://shopify.dev/docs/api/liquid/filters/image_url
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

  /**
   * Reassign the source from the original on resize.
   */
  async resized() {
    const { src } = await loadImage(this.original);
    this.src = src;
  }

  /**
   * Do not terminate on image load as we need to set the src on resize.
   */
  onLoad() {
    // Do not terminate on image load as we need.
  }
}
