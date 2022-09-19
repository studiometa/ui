import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface FrameFormProps extends BaseProps {
  $el: HTMLFormElement;
}

/**
 * FrameForm class.
 */
export class FrameForm<T extends BaseProps = BaseProps> extends Base<T & FrameFormProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'FrameForm',
  };

  /**
   * Get the form action.
   */
  get action(): string {
    return this.$el.action;
  }
}
