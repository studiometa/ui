import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { withoutLeadingSlash, withoutTrailingSlash } from '@studiometa/js-toolkit/utils';
import { Figure } from './Figure.js';

export interface FigureTwicpicsProps extends BaseProps {
  $options: {
    transform: string;
    domain: string;
    path: string;
    step: number;
    mode: string;
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
    },
  };

  /**
   * Get the Twicpics path.
   */
  get path():string {
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
   * Add Twicpics transforms, path and domain to the URL.
   */
  set src(value: string) {
    const url = new URL(value, window.location.origin);
    url.host = this.domain;
    url.pathname = `/${this.path}${url.pathname}`

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

  /**
   * Do not terminate on image load as we need to set the src on resize.
   */
  onLoad() {
    // Do not terminate on image load as we need.
  }
}
