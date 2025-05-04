import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { FrameLoader } from './FrameLoader.js';
import type { FrameLoaderProps } from './FrameLoader.js';

export type FrameTriggerLoaderProps = FrameLoaderProps;

/**
 * FrameTriggerLoader class.
 */
export class FrameTriggerLoader<T extends BaseProps = BaseProps> extends FrameLoader<
  T & FrameTriggerLoaderProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'FrameTriggerLoader',
  }
}
