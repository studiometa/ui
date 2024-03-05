import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import {
  withLeadingSlash,
  withoutLeadingSlash,
  withoutTrailingSlash,
} from '@studiometa/js-toolkit/utils';
import { Figure, loadImage } from './Figure.js';

export interface FigureTwicpicsProps extends BaseProps {
  $options: {
    transform: string;
    domain: string;
    path: string;
    step: number;
    mode: string;
    dpr: boolean;
  };
}

/**
 * Normalize the given size to the step option.
 */
// eslint-disable-next-line no-use-before-define
function normalizeSize(that: FigureTwicpics, prop: string): number {
  const { step } = that.$options;
  return Math.ceil(that.$refs.img[prop] / step) * step;
}

/**
 * Determine if the user agent is a bot or not.
 */
const isBot = /bot|crawl|slurp|spider/i.test(navigator.userAgent);

/**
 * Figure class.
 *
 * Manager lazyloading image sources.
 */
export class FigureTwicpics<T extends BaseProps = BaseProps> extends Figure<
  T & FigureTwicpicsProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Figure.config,
    name: 'FigureTwicpics',
    options: {
      ...Figure.config.options,
      transform: String,
      domain: String,
      path: String,
      step: {
        type: Number,
        default: 50,
      },
      mode: {
        type: String,
        default: 'cover',
      },
      dpr: {
        type: Boolean,
        default: true,
      },
    },
  };

  /**
   * Get the Twicpics path.
   */
  get path(): string {
    return withoutTrailingSlash(withoutLeadingSlash(this.$options.path));
  }

  /**
   * Get the Twicpics domain.
   */
  get domain(): string {
    const url = new URL(this.$refs.img.dataset.src);
    return url.host;
  }

  /**
   * Get formattted original source.
   */
  get original() {
    return this.formatSrc(super.original);
  }

  /**
   * Get the current device pixel ratio
   * Returns 1 if user agent is considered as a bot.
   */
  get devicePixelRatio() {
    if (!this.$options.dpr) {
      return 1;
    }

    return window.devicePixelRatio;
  }

  /**
   * Format the source for Twicpics.
   */
  formatSrc(src: string): string {
    const url = new URL(src, 'https://localhost');
    url.host = this.domain;
    url.port = '';

    if (this.path && !url.pathname.startsWith(withLeadingSlash(this.path))) {
      url.pathname = `/${this.path}${url.pathname}`;
    }

    let width = normalizeSize(this, 'offsetWidth');
    let height = normalizeSize(this, 'offsetHeight');

    if (!isBot) {
      width *= this.devicePixelRatio;
      height *= this.devicePixelRatio;
    }

    url.searchParams.set(
      'twic',
      ['v1', this.$options.transform, `${this.$options.mode}=${width}x${height}`]
        .filter(Boolean)
        .join('/'),
    );

    url.search = decodeURIComponent(url.search);

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
