import { Base } from '@studiometa/js-toolkit/Base';
import { withMountWhenInView } from '@studiometa/js-toolkit/withMountWhenInView';
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
