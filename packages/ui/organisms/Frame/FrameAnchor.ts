import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseTypeParameter } from '@studiometa/js-toolkit';

export interface FrameAnchorInterface extends BaseTypeParameter {
  $el: HTMLAnchorElement;
}

/**
 * FrameAnchor class.
 */
export class FrameAnchor<T extends BaseTypeParameter = BaseTypeParameter> extends Base<
  FrameAnchorInterface & T
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'FrameAnchor',
  };

  /**
   * Get the URL.
   */
  get href():string {
    return this.$el.href;
  }
}
