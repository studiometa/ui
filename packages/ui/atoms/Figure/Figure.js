import { withMountWhenInView } from '@studiometa/js-toolkit';
import { Transition } from '../../primitives/index.js';

/**
 * @typedef {Figure & {
 *   $refs: {
 *     img: HTMLImageElement
 *   },
 *   $options: {
 *     lazy: boolean
 *   }
 * }} FigureInterface
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

    const src = img.getAttribute('data-src');

    if (this.$options.lazy && src && src !== this.src) {
      let tempImg = new Image();
      tempImg.onload = () => {
        this.enter();
        this.src = src;
        tempImg = null;
      };
      tempImg.src = src;
    }
  }
}
