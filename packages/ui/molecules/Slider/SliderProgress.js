import { transform, map, domScheduler } from '@studiometa/js-toolkit/utils';
import AbstractSliderChild from './AbstractSliderChild.js';

/**
 * @typedef {SliderProgress & {
 *   $refs: {
 *     progress: HTMLElement
 *   },
 *   $parent: import('./Slider.js').default
 * }} SliderProgressInterface
 */

/**
 * SliderProgress class.
 */
export default class SliderProgress extends AbstractSliderChild {
  /**
   * Config.
   */
  static config = {
    name: 'SliderProgress',
    refs: ['progress'],
  };

  /**
   * Update the progress indicator.
   *
   * @this    {SliderProgressInterface}
   * @param   {number} index The new active index.
   * @returns {void}
   */
  update(index) {
    domScheduler.read(() => {
      const { progress } = this.$refs;
      const x = map(index, 0, this.$parent.indexMax, progress.clientWidth * -1, 0);
      domScheduler.write(() => {
        transform(progress, { x });
      });
    });
  }
}
