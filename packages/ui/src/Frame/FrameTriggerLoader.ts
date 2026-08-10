import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { FrameLoader } from './FrameLoader.js';
import type { FrameLoaderProps } from './FrameLoader.js';

export type FrameTriggerLoaderProps = FrameLoaderProps;

/**
 * FrameTriggerLoader class.
 *
 * The per-trigger loading indicator of the Frame navigation system. A `FrameLoader`
 * scoped to a single `AbstractFrameTrigger`, whose `enter()`/`leave()` transitions are
 * played only while that trigger's own request is in flight, rather than for every
 * request handled by the parent `Frame`.
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
