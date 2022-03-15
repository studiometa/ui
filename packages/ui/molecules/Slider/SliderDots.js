/* eslint-disable-next-line max-classes-per-file */
import AbstractSliderChild from './AbstractSliderChild.js';

/**
 * @typedef {SliderDots & {
 *   $refs: {
 *     dots: HTMLButtonElement[],
 *   }
 * }} SliderDotsInterface
 */

/**
 * SliderDots class.
 */
export default class SliderDots extends AbstractSliderChild {
  /**
   * Config.
   */
  static config = {
    name: 'SliderDots',
    refs: ['dots[]'],
  };

  /**
   * Update dots classes according to the new index.
   *
   * @this    {SliderDotsInterface}
   * @param   {number} index
   * @returns {void}
   */
  update(index) {
    this.$refs.dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', index === i);
    });
  }

  /**
   * Go to the given index on dot click.
   *
   * @param   {MouseEvent} event
   * @param   {number} index
   * @returns {void}
   */
  onDotsClick(event, index) {
    this.$parent.goTo(index);
  }
}
