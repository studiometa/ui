import { Base } from '@studiometa/js-toolkit';

/**
 * @typedef {FrameAnchor & {
 *   $el: HTMLAnchorElement
 * }} FrameAnchorInterface
 */

/**
 * FrameAnchor class.
 */
export default class FrameAnchor extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'FrameAnchor',
  };

  /**
   * Get the URL.
   *
   * @this    {FrameAnchorInterface}
   * @returns {string}
   */
  get href() {
    return this.$el.href;
  }
}
