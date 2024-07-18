import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export interface TargetProps extends BaseProps {}

/**
 * Target class.
 */
export class Target extends Base<TargetProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Target',
  };
}
