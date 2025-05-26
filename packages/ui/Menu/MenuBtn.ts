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
   */
  isHover = false;

  /**
   * Dispatch the mouseenter event.
   */
  onMouseenter({ event }: { event: MouseEvent }) {
    this.isHover = true;
    event.stopPropagation();
  }

  /**
   * Dispatch the mouseleave event.
   */
  onMouseleave({ event }: { event: MouseEvent }) {
    this.isHover = false;
    event.stopPropagation();
  }
}
