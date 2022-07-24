import { withMountWhenInView } from '@studiometa/js-toolkit';
import Transition from '../../primitives/Transition/Transition.js';

/**
 * @typedef {Object} FigureRefs
 * @property {HTMLImageElement} img
 */

/**
 * @typedef {Object} FigureInterface
 * @property {FigureRefs} $refs
 */

/**
 * Figure class.
 *
 * Manager lazyloading image sources.
 */
export default class Figure extends withMountWhenInView(Transition, { threshold: [0, 1] }) {
  /**
   * Config.
   */
  static config = {
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
   * @returns {HTMLImageElement}
   */
  get target() {
    return this.$refs.img;
  }

  /**
   * Get the image source.
   *
   * @this {Figure & FigureInterface}
   * @returns {string}
   */
  get src() {
    return this.$refs.img.src;
  }

  /**
   * Set the image source.
   *
   * @this {Figure & FigureInterface}
   * @param   {string} value
   * @returns {void}
   */
  set src(value) {
    this.$refs.img.src = value;
  }

  /**
   * Load on mount.
   * @this {Figure & FigureInterface}
   */
  mounted() {
    const { img } = this.$refs;

    if (!img) {
      throw new Error('[Figure] The `img` ref is required.');
    }

    if (!(img instanceof HTMLImageElement)) {
      throw new Error('[Figure] The `img` ref must be an `<img>` element.');
    }

    if (
      this.$options.lazy &&
      img.hasAttribute('data-src') &&
      img.getAttribute('data-src') !== this.src
    ) {
      img.onload = () => {
        this.enter();
      };
      this.src = img.getAttribute('data-src');
    }
  }
}
