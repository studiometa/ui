import { Base, withMountWhenInView } from '@studiometa/js-toolkit';

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
export default class Figure extends withMountWhenInView(Base, { threshold: [0, 1] }) {
  static config = {
    name: 'Figure',
    refs: ['img'],
    options: {
      lazy: Boolean,
    },
  };

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
    if (!this.$refs.img) {
      throw new Error('[Figure] The `img` ref is required.');
    }

    if (!(this.$refs.img instanceof HTMLImageElement)) {
      throw new Error('[Figure] The `img` ref must be an `<img>` element.');
    }

    if (
      this.$options.lazy &&
      this.$refs.img.hasAttribute('data-src') &&
      this.$refs.img.getAttribute('data-src') !== this.src
    ) {
      this.src = this.$refs.img.getAttribute('data-src');
    }
  }
}
