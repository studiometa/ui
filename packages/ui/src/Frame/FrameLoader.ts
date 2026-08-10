import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/index.js';
import type { TransitionProps } from '../decorators/withTransition.js';

export interface FrameLoaderProps extends BaseProps {
  $options: TransitionProps['$options'] & {
    enterKeep: true;
    leaveKeep: true;
  };
}

/**
 * Class.
 */
export class FrameLoader<T extends BaseProps = BaseProps> extends Transition<T & FrameLoaderProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'FrameLoader',
  };

  get $options() {
    const options = super.$options;

    return {
      ...options,
      enterKeep: true,
      leaveKeep: true,
    };
  }
}
