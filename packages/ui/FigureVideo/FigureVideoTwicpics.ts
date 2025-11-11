import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import {
  withLeadingSlash,
  withoutLeadingSlash,
  withoutTrailingSlash,
} from '@studiometa/js-toolkit/utils';
import { loadImage } from '../Figure/utils.js';
import { FigureVideo } from './FigureVideo.js';

export interface FigureVideoTwicpicsProps extends BaseProps {
  $refs: {
    video: HTMLVideoElement;
  };
  $options: {
    lazy: boolean;
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
function normalizeSize(that: FigureVideoTwicpics, prop: string): number {
  const { step } = that.$options;
  return Math.ceil(that.$refs.video[prop] / step) * step;
}

/**
 * FigureVideoTwicpics class.
 *
 * Manager lazyloading image sources.
 * @link https://ui.studiometa.dev/components/FigureVideoTwicpics/
 */
export class FigureVideoTwicpics<T extends BaseProps = BaseProps> extends FigureVideo<
  T & FigureVideoTwicpicsProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...FigureVideo.config,
    name: 'FigureVideoTwicpics',
    options: {
      ...FigureVideo.config.options,
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
  get path(): string {
    return withoutTrailingSlash(withoutLeadingSlash(this.$options.path));
  }

  /**
   * Get the Twicpics domain.
   */
  get domain(): string {
    if (this.$options.domain) {
      return this.$options.domain;
    }
    const url = new URL(this.sources[0].dataset.src);
    return url.host;
  }

  /**
   * Format the source for Twicpics.
   * @param {string} src
   * @param {Array} options
   * @returns {string}
   */
  formatSrc(src: string, options: Array<string> = []): string {
    const url = new URL(src, 'https://localhost');
    url.host = this.domain;
    url.port = '';

    if (this.path && !url.pathname.startsWith(withLeadingSlash(this.path))) {
      url.pathname = `/${this.path}${url.pathname}`;
    }

    const width = normalizeSize(this, 'offsetWidth');
    const height = normalizeSize(this, 'offsetHeight');

    this.$log(this.$options.mode, width, height);

    url.searchParams.set(
      'twic',
      ['v1', this.$options.transform, `${this.$options.mode}=${width}x${height}`, ...options]
        .filter(Boolean)
        .join('/'),
    );

    url.search = decodeURIComponent(url.search);

    return url.toString();
  }

  /**
   * Load poster
   */
  loadPoster(): Promise<void|HTMLImageElement> {
    const { video } = this.$refs;

    if (!video.dataset.poster) {
      return Promise.resolve();
    }

    const twicPoster = this.formatSrc(video.dataset.poster);

    return loadImage(twicPoster).then(() => {
      video.poster = twicPoster;
      this.$log('fresh poster loaded');
    });
  }

  /**
   * Load sources
   */
  loadSources(): Promise<void> {
    const { video } = this.$refs;

    this.sources.forEach((source) => {
      if (!source.dataset.src) {
        return;
      }
      source.src = this.formatSrc(
        source.dataset.src,
        source.dataset.output ? [`output=${source.dataset.output}`] : [],
      );
    });

    return new Promise((resolve) => {
      const loadHandler = () => {
        resolve();
        video.removeEventListener('canplaythrough', loadHandler);
        this.$log('fresh sources loaded');
      };

      video.addEventListener('canplaythrough', loadHandler);

      this.$refs.video.width = normalizeSize(this, 'offsetWidth');
      this.$refs.video.height = normalizeSize(this, 'offsetHeight');

      video.load();
    });
  }

  /**
   * Reassign the source from the original on resize.
   */
  async resized() {
    const width = normalizeSize(this, 'offsetWidth');
    const height = normalizeSize(this, 'offsetHeight');

    if (width === this.$refs.video.width && height === this.$refs.video.height) {
      return;
    }

    this.$refs.video.width = width;
    this.$refs.video.height = height;

    await this.load();
  }

  /**
   * Do not terminate on image load as we need to set the src on resize.
   */
  onLoad() {
    // Do not terminate on image load as we need.
  }
}
