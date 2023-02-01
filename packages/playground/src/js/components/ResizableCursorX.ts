import { Base, withDrag } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export type ResizableCursorXProps = BaseProps;

/**
 * ResizableCursorX class.
 */
export default class ResizableCursorX extends withDrag(Base)<ResizableCursorXProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'ResizableCursorX',
  };
}
