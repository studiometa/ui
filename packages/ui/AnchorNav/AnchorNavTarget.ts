import { Base, withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

/**
 * Manage a sticky table section.
 */
export class AnchorNavTarget extends withMountWhenInView(Base)<BaseProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AnchorNavTarget',
  };
}
