import AbstractSliderChild from './AbstractSliderChild.js';

/**
 * @typedef {SliderBtn & {
 *   $parent: import('./Slider.js').default
 * }} SliderBtnInterface
 */

/**
 * SliderBtn class.
 */
export default class SliderBtn extends AbstractSliderChild {
  /**
   * Config.
   */
  static config = {
    name: 'SliderBtn',
    options: {
      prev: Boolean,
      next: Boolean,
    },
  };

  /**
   * Update attributes.
   *
   * @this    {SliderBtnInterface}
   * @param   {number} index
   * @returns {void}
   */
  update(index) {
    if (
      (index === 0 && this.$options.prev) ||
      (index === this.$parent.indexMax && this.$options.next)
    ) {
      this.$el.setAttribute('disabled', '');
    } else {
      this.$el.removeAttribute('disabled');
    }
  }

  /**
   * Go prev or next on click.
   *
   * @this    {SliderBtnInterface}
   * @returns {void}
   */
  onClick() {
    const { prev, next } = this.$options;

    if (prev) {
      this.$parent.goPrev();
    } else if (next) {
      this.$parent.goNext();
    }
  }
}
