import { Base, withDrag } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export type ResizableCursorYProps = BaseProps;

/**
 * ResizableCursorY class.
 */
export default class ResizableCursorY extends withDrag(Base)<ResizableCursorYProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'ResizableCursorY',
  };
}
