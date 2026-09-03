import { withResize } from '@studiometa/js-toolkit/withResize';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { loadImage } from '@studiometa/js-toolkit/utils/loadImage';
import { withLeadingSlash } from '@studiometa/js-toolkit/utils/withLeadingSlash';
import { withoutLeadingSlash } from '@studiometa/js-toolkit/utils/withoutLeadingSlash';
import { withoutTrailingSlash } from '@studiometa/js-toolkit/utils/withoutTrailingSlash';
import { normalizeSize } from '../Figure/utils.js';
import { FigureVideo, type FigureVideoProps } from './FigureVideo.js';

export type FigureVideoTwicpicsProps = FigureVideoProps & {
  $options: FigureVideoProps['$options'] & {
    transform: string;
    domain: string;
    path: string;
    step: number;
    mode: string;
  };
};

/**
 * Dynamic video figure that rewrites its poster and source URLs into
 * TwicPics URLs sized to the rendered element, and reloads them on resize.
 *
 * @link https://ui.studiometa.dev/reference/items/FigureVideoTwicpics/
 */
export class FigureVideoTwicpics<T extends BaseProps = BaseProps> extends withResize(FigureVideo)<
  FigureVideoTwicpicsProps & T
> {
  static config: BaseConfig = {
    ...FigureVideo.config,
    name: 'FigureVideoTwicpics',
    options: {
      ...FigureVideo.config.options,
      transform: String,
      domain: String,
      path: String,
      step: { type: Number, default: 50 },
      mode: { type: String, default: 'cover' },
    },
  };

  /** @private */
  __normalizeSize(prop: 'offsetWidth' | 'offsetHeight'): number {
    return normalizeSize(this.$refs.video[prop], this.$options.step);
  }

  /** The TwicPics path. */
  get path(): string {
    return withoutTrailingSlash(withoutLeadingSlash(this.$options.path));
  }

  /** The TwicPics domain: the option, or the first source's own host. */
  get domain(): string {
    if (this.$options.domain) {
      return this.$options.domain;
    }
    const src = this.sources[0]?.dataset.src;
    return src ? new URL(src).host : '';
  }

  /** Format a source for TwicPics. */
  formatSrc(src: string, extra: string[] = []): string {
    const url = new URL(src, 'https://localhost');
    url.host = this.domain;
    url.port = '';

    if (this.path && !url.pathname.startsWith(withLeadingSlash(this.path))) {
      url.pathname = `/${this.path}${url.pathname}`;
    }

    const width = this.__normalizeSize('offsetWidth');
    const height = this.__normalizeSize('offsetHeight');

    url.searchParams.set(
      'twic',
      ['v1', this.$options.transform, `${this.$options.mode}=${width}x${height}`, ...extra]
        .filter(Boolean)
        .join('/'),
    );

    url.search = decodeURIComponent(url.search);

    return url.toString();
  }

  async loadPoster(): Promise<void> {
    const { video } = this.$refs;

    if (!video.dataset.poster) {
      return;
    }

    const twicPoster = this.formatSrc(video.dataset.poster);

    try {
      await loadImage(twicPoster);
      video.poster = twicPoster;
    } catch (error) {
      this.$error(
        'figure-video.poster-load-failed',
        `Failed to load poster "${twicPoster}".`,
        error,
      );
    }
  }

  loadSources(): Promise<void> {
    const { video } = this.$refs;

    for (const source of this.sources) {
      if (!source.dataset.src) {
        continue;
      }
      source.src = this.formatSrc(
        source.dataset.src,
        source.dataset.output ? [`output=${source.dataset.output}`] : [],
      );
    }

    /**
     * Settled by either outcome, mirroring the base `loadSources()`.
     *
     * This override waits on `canplaythrough` where the base waits on
     * `loadeddata`, and it had the same defect: without an `error` listener a
     * video whose sources fail never settles, and `mounted()` awaits it — so
     * no diagnostic, no transition and no retry. Fixing only the base left the
     * TwicPics variant hanging, because this method replaces it entirely.
     */
    return new Promise<void>((resolve, reject) => {
      const settle = (handler: () => void) => {
        video.removeEventListener('canplaythrough', onReady);
        video.removeEventListener('error', onError);
        handler();
      };
      const onReady = () => settle(resolve);
      const onError = () =>
        settle(() => reject(new Error(`Failed to load the sources of "${video.currentSrc}".`)));

      video.addEventListener('canplaythrough', onReady, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.width = this.__normalizeSize('offsetWidth');
      video.height = this.__normalizeSize('offsetHeight');
      video.load();
    });
  }

  /**
   * Reassign and reload the sources from the original on resize.
   *
   * Started rather than awaited, for the reason `AbstractFigureDynamic`
   * documents: `ResizeHook.resized` returns `void`.
   */
  resized(): void {
    void this.reloadForSize();
  }

  /** Resize the video element and reload its sources, if the size changed. */
  async reloadForSize(): Promise<void> {
    const width = this.__normalizeSize('offsetWidth');
    const height = this.__normalizeSize('offsetHeight');

    if (width === this.$refs.video.width && height === this.$refs.video.height) {
      return;
    }

    this.$refs.video.width = width;
    this.$refs.video.height = height;

    await this.load();
  }
}
