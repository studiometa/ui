import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

/**
 * MenuBtn class.
 */
export class MenuBtn<T extends BaseProps = BaseProps> extends Base<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MenuBtn',
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
  }

  /**
   * Dispatch the mouseleave event.
   * @param   {MouseEvent} event
   * @returns {void}
   */
  onMouseleave(event) {
    this.isHover = false;
    event.stopPropagation();
  }
}
