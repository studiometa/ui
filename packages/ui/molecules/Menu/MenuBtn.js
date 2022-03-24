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
   * Wether the button has focus or not.
   * @type {boolean}
   */
  hasFocus = false;

  /**
   * Set `hasFocus` flag.
   *
   * @returns {void}
   */
  onFocusin() {
    this.hasFocus = true;
  }

  /**
   * Set `hasFocus` flag.
   *
   * @returns {void}
   */
  onFocusout() {
    this.hasFocus = false;
  }

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
    this.$emit('btn-mouseenter', event);
  }

  /**
   * Dispatch the mouseleave event.
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onMouseleave(event) {
    this.$emit('btn-mouseleave', event);
  }
}
