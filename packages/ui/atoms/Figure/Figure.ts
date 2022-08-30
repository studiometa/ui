import { withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseTypeParameter } from '@studiometa/js-toolkit';
import { Transition } from '../../primitives/index.js';

export interface FigureInterface extends BaseTypeParameter {
  $refs: {
    img: HTMLImageElement;
  };
  $options: {
    lazy: boolean;
  };
}

/**
 * Figure class.
 */
export class Figure extends withMountWhenInView<typeof Transition, FigureInterface>(Transition, {
  threshold: [0, 1],
}) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...Transition.config,
    name: 'Figure',
    refs: ['img'],
    options: {
      ...Transition.config.options,
      lazy: Boolean,
    },
  };

  /**
   * Get the transition target.
   *
   * @this {FigureInterface}
   * @returns {HTMLImageElement}
   */
  get target() {
    return this.$refs.img;
  }

  /**
   * Get the image source.
   *
   * @this {FigureInterface}
   * @returns {string}
   */
  get src() {
    return this.$refs.img.src;
  }

  /**
   * Set the image source.
   *
   * @this {FigureInterface}
   * @param   {string} value
   * @returns {void}
   */
  set src(value) {
    this.$refs.img.src = value;
  }

  /**
   * Load on mount.
   * @this {FigureInterface}
   */
  mounted() {
    const { img } = this.$refs;

    if (!img) {
      throw new Error('[Figure] The `img` ref is required.');
    }

    if (!(img instanceof HTMLImageElement)) {
      throw new Error('[Figure] The `img` ref must be an `<img>` element.');
    }

    const { src } = img.dataset;

    if (this.$options.lazy && src && src !== this.src) {
      let tempImg = new Image();
      tempImg.addEventListener('load', () => {
        this.enter();
        this.src = src;
        tempImg = null;
      }, { once: true });
      tempImg.src = src;
    }
  }
}
