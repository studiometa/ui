import { withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Transition } from '../../primitives/index.js';
import { loadImage } from '../index.js';

export interface FigureVideoProps extends BaseProps {
  $refs: {
    video: HTMLVideoElement;
  };
  $options: {
    lazy: boolean;
  };
}

/**
 * FigureVideo class.
 */
export class FigureVideo<T extends BaseProps = BaseProps> extends withMountWhenInView<Transition>(
  Transition,
  {
    threshold: [0, 1],
  },
)<T & FigureVideoProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Transition.config,
    name: 'FigureVideo',
    emits: ['load'],
    refs: ['video'],
    options: {
      ...Transition.config.options,
      lazy: Boolean,
    },
  };

  /**
   * Get the transition target.
   */
  get target(): HTMLVideoElement {
    return this.$refs.video;
  }

  /**
   * Get the video sources.
   */
  get sources(): Array<HTMLSourceElement> {
    return Array.from(this.$refs.video.querySelectorAll('source'));
  }

  /**
   * Load poster
   */
  loadPoster(): Promise<void|HTMLImageElement> {
    const { video } = this.$refs;

    if (!video.dataset.poster) {
      return Promise.resolve();
    }

    return loadImage(video.dataset.poster).then(() => {
      video.poster = video.dataset.poster;
      this.$log('fresh poster loaded');
    })
  }

  /**
   * Load sources
   * @returns {Promise}
   */
  loadSources(): Promise<void> {
    const { video } = this.$refs;

    this.sources.forEach((source) => {
      if (!source.dataset.src) {
        return;
      }
      source.src = source.dataset.src;
    });

    return new Promise<void>((resolve) => {
      const loadHandler = () => {
        video.removeEventListener('loadeddata', loadHandler);
        this.$log('fresh sources loaded');
        resolve();
      };
      video.addEventListener('loadeddata', loadHandler);
      video.load();
    });
  }

  /**
   * Load
   * @returns {Promise}
   */
  load(): Promise<any[]> {
    return Promise.all([this.loadPoster(), this.loadSources()]);
  }

  /**
   * Load on mount.
   */
  async mounted() {
    this.$log('mounted');
    const { video } = this.$refs;

    if (!video) {
      throw new Error('[VideoFigure] The `video` ref is required.');
    }

    if (!(video instanceof HTMLVideoElement)) {
      throw new Error('[VideoFigure] The `video` ref must be an `<video>` element.');
    }

    if (!this.$options.lazy) {
      this.$log('Lazy loading disabled');
      return;
    }

    this.$log('start loading');
    await this.load();
    this.$log('all is loaded');
    await this.enter();
    this.$log('transition done');
    this.$emit('load');
  }

  /**
   * Terminate the component on load.
   */
  onLoad() {
    this.$terminate();
  }
}
