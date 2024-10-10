import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import {
  withLeadingSlash,
  withoutLeadingSlash,
  withoutTrailingSlash,
} from '@studiometa/js-toolkit/utils';
import { AbstractFigureDynamic } from './AbstractFigureDynamic.js';
import { normalizeSize } from './utils.js';

export interface FigureTwicpicsProps extends BaseProps {
  $options: {
    transform: string;
    domain: string;
    path: string;
    mode: string;
    dpr: boolean;
  };
}

/**
 * Determine if the user agent is a bot or not.
 */
const isBot = /bot|crawl|slurp|spider/i.test(navigator.userAgent);

/**
 * FigureTwicpics class.
 */
export class FigureTwicpics<T extends BaseProps = BaseProps> extends AbstractFigureDynamic<
  T & FigureTwicpicsProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractFigureDynamic.config,
    name: 'FigureTwicpics',
    options: {
      ...AbstractFigureDynamic.config.options,
      transform: String,
      domain: String,
      path: String,
      disable: Boolean,
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
   * Get the current device pixel ratio
   * Returns 1 if user agent is considered as a bot.
   * Returns 1 if disabled by the `data-option-no-dpr` attribute.
   */
  get devicePixelRatio() {
    if (!this.$options.dpr || isBot) {
      return 1;
    }

    return window.devicePixelRatio;
  }

  /**
   * Format the source for Twicpics.
   */
  formatSrc(src: string): string {
    const { transform, mode, step } = this.$options;

    const url = new URL(src, 'https://localhost');
    url.host = this.domain;
    url.port = '';

    if (this.path && !url.pathname.startsWith(withLeadingSlash(this.path))) {
      url.pathname = `/${this.path}${url.pathname}`;
    }

    const width = normalizeSize(this.$refs.img.offsetWidth, step) * this.devicePixelRatio;
    const height = normalizeSize(this.$refs.img.offsetHeight, step) * this.devicePixelRatio;

    url.searchParams.set(
      'twic',
      ['v1', transform, `${mode}=${width}x${height}`].filter(Boolean).join('/'),
    );

    url.search = decodeURIComponent(url.search);

    return url.toString();
  }
}
