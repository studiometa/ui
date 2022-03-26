import { Base } from '@studiometa/js-toolkit';

/**
 * MenuBtn class.
 */
export default class MenuBtn extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'MenuBtn',
    debug: true,
    emits: ['btn-click', 'btn-mouseenter', 'btn-mouseleave'],
  };

  /**
   * Dispatch the click event.
   *
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onClick(event) {
    event.stopPropagation();
    this.$emit('btn-click', event);
  }

  /**
   * Dispatch the mouseenter event.
   *
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onMouseenter(event) {
    event.stopPropagation();
    this.$emit('btn-mouseenter', event);
  }

  /**
   * Dispatch the mouseleave event.
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onMouseleave(event) {
    event.stopPropagation();
    this.$emit('btn-mouseleave', event);
  }
}
