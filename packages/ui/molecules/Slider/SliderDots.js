import { withTransition } from '../../decorators/index.js';
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
export default class SliderDots extends withTransition(AbstractSliderChild) {
  /**
   * Config.
   */
  static config = {
    name: 'SliderDots',
    refs: ['dots[]'],
  };

  /**
   * Get target.
   * @this {SliderDotsInterface}
   * @returns {HTMLButtonElement[]}
   */
  get target() {
    return this.$refs.dots;
  }

  /**
   * The current active index.
   * @type {number}
   */
  currentIndex = 0;

  /**
   * Update dots classes according to the new index.
   *
   * @this    {SliderDotsInterface}
   * @param   {number} index
   * @returns {void}
   */
  update(index) {
    this.leave(this.$refs.dots[this.currentIndex]);
    this.enter(this.$refs.dots[index]);
    this.currentIndex = index;
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
