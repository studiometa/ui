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
   * Wether the button is hovered or not.
   * @type {boolean}
   */
  isHover = false;

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
    this.isHover = true;
    event.stopPropagation();
    this.$emit('btn-mouseenter', event);
  }

  /**
   * Dispatch the mouseleave event.
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onMouseleave(event) {
    this.isHover = false;
    event.stopPropagation();
    this.$emit('btn-mouseleave', event);
  }
}
