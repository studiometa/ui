import { Base } from '@studiometa/js-toolkit';

/**
 * @typedef {FrameForm & {
 *   $el: HTMLFormElement
 * }} FrameFormInterface
 */

/**
 * FrameForm class.
 */
export default class FrameForm extends Base {
  static config = {
    name: 'FrameForm',
  };

  /**
   * Get the form action.
   *
   * @this    {FrameFormInterface}
   * @returns {string}
   */
  get action() {
    return this.$el.action;
  }
}
