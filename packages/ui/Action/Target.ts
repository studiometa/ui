import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export interface TargetProps extends BaseProps {}

/**
 * Target class.
 *
 * A minimal marker component that exposes its element as an addressable target for
 * the `Action` component. It defines no behaviour of its own; declaring
 * `data-component="Target"` simply lets `Action` bindings resolve and act on this
 * element by name.
 */
export class Target extends Base<TargetProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Target',
  };
}
