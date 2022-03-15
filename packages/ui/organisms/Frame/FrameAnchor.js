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
    emits: ['frame-click'],
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

  /**
   * Dispatch the link click event.
   *
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onClick(event) {
    this.$emit('frame-click', event);
  }
}
