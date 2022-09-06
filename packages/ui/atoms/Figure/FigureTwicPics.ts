import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Figure } from './Figure.js';

export interface FigureTwicPicsProps extends BaseProps {
  $options: {
    transform: string;
    step: number;
    mode: string;
  };
}

/**
 * Normalize the given size to the step option.
 */
// eslint-disable-next-line no-use-before-define
function normalizeSize(that:FigureTwicPics, prop:string):number {
  const { step } = that.$options;
  return Math.ceil(that.$refs.img[prop] / step) * step;
}

/**
 * Figure class.
 *
 * Manager lazyloading image sources.
 */
export class FigureTwicPics<T extends BaseProps = BaseProps> extends Figure<T & FigureTwicPicsProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Figure.config,
    name: 'FigureTwicPics',
    options: {
      ...Figure.config.options,
      transform: String,
      step: {
        type: Number,
        default: 50,
      },
      mode: {
        type: String,
        default: 'cover',
      },
    },
  };

  /**
   * Get the TwicPics domain.
   */
  get domain():string {
    const url = new URL(this.$refs.img.dataset.src);
    return url.host;
  }

  /**
   * Add TwicPics transforms and domain to the URL.
   */
  set src(value:string) {
    const url = new URL(value, window.location.origin);
    url.host = this.domain;

    const width = normalizeSize(this, 'offsetWidth');
    const height = normalizeSize(this, 'offsetHeight');

    url.searchParams.set(
      'twic',
      ['v1', this.$options.transform, `${this.$options.mode}=${width}x${height}`]
        .filter(Boolean)
        .join('/'),
    );

    url.search = decodeURIComponent(url.search);

    super.src = url.toString();
  }

  /**
   * Reassign the source from the original on resized.
   */
  resized() {
    this.src = this.$refs.img.dataset.src;
  }
}
