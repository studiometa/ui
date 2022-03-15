import AbstractSliderChild from './AbstractSliderChild.js';

/**
 * @typedef {SliderCount & { $refs: { current: HTMLElement } }} SliderCountInterface
 */

/**
 * SliderCount class.
 */
export default class SliderCount extends AbstractSliderChild {
  /**
   * Config.
   */
  static config = {
    name: 'SliderCount',
    refs: ['current'],
  };

  /**
   * Update the current counter indicator.
   *
   * @this    {SliderCountInterface}
   * @param   {number} index The new active index.
   * @returns {void}
   */
  update(index) {
    this.$refs.current.innerHTML = `${index + 1}`;
  }
}
