import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export interface FrameAnchorProps extends BaseProps {
  $el: HTMLAnchorElement;
}

/**
 * FrameAnchor class.
 */
export class FrameAnchor<T extends BaseProps = BaseProps> extends Base<T & FrameAnchorProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'FrameAnchor',
  };

  /**
   * Get the URL.
   */
  get href(): string {
    return this.$el.href;
  }
}
