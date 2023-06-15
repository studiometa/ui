import { withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { Transition } from '../../primitives/index.js';

export interface FigureProps extends BaseProps {
  $refs: {
    img: HTMLImageElement;
  };
  $options: {
    lazy: boolean;
  };
}

/**
 * Load the given image.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.src = src;
  });
}

/**
 * Figure class.
 */
export class Figure<T extends BaseProps = BaseProps> extends withMountWhenInView<Transition>(
  Transition,
  {
    threshold: [0, 1],
  },
)<T & FigureProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Transition.config,
    name: 'Figure',
    emits: ['load'],
    refs: ['img'],
    options: {
      ...Transition.config.options,
      lazy: Boolean,
    },
  };

  /**
   * Get the transition target.
   */
  get target() {
    return this.$refs.img;
  }

  /**
   * Get the image source.
   */
  get src() {
    return this.$refs.img.src;
  }

  /**
   * Set the image source.
   */
  set src(value: string) {
    this.$refs.img.src = value;
  }

  /**
   * Get the original source.
   */
  get original() {
    return this.$refs.img.dataset.src;
  }

  /**
   * Load on mount.
   */
  async mounted() {
    const { img } = this.$refs;

    if (!img) {
      throw new Error('[Figure] The `img` ref is required.');
    }

    if (!(img instanceof HTMLImageElement)) {
      throw new Error('[Figure] The `img` ref must be an `<img>` element.');
    }

    const src = this.original;

    if (this.$options.lazy && src && src !== this.src) {
      await loadImage(src);
      this.src = src;
      this.enter();
      this.$emit('load');
    }
  }

  /**
   * Terminate the component on load.
   */
  onLoad() {
    this.$terminate();
  }
}
