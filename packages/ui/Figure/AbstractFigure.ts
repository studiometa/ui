import { withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { loadImage } from '@studiometa/js-toolkit/utils';
import { Transition } from '../Transition/index.js';

export interface AbstractFigureProps extends BaseProps {
  $refs: {
    img: HTMLImageElement;
  };
  $options: {
    lazy: boolean;
  };
}

/**
 * Figure class.
 *
 * Shared base for the image figure components. It wraps a single `img` ref in a
 * `Transition` and, through the `withMountWhenInView` decorator, defers loading
 * of the `data-src` source until the element enters the viewport when the `lazy`
 * option is set, running the enter transition and emitting `load` once the image
 * is ready.
 */
export class AbstractFigure<
  T extends BaseProps = BaseProps,
> extends withMountWhenInView<Transition>(Transition, {
  threshold: [0, 1],
})<T & AbstractFigureProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Transition.config,
    name: 'AbstractFigure',
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

    if (!img || !(img instanceof HTMLImageElement)) {
      this.$warn('The `img` refs is missing or not an `<img>` element.');
      return;
    }

    const src = this.original;

    if (this.$options.lazy && src && src !== this.src) {
      try {
        await loadImage(src);
      } catch {
        this.$warn(`Failed to load image "${src}".`);
        return;
      }

      this.src = src;
      this.enter();
      this.$emit('load');
    }
  }
}
