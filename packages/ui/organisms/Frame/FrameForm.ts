import { Base } from '@studiometa/js-toolkit';
import type { BaseTypeParameter, BaseConfig } from '@studiometa/js-toolkit';

export interface FrameFormInterface extends BaseTypeParameter {
  $el: HTMLFormElement;
}

/**
 * FrameForm class.
 */
export class FrameForm<T extends BaseTypeParameter = BaseTypeParameter> extends Base<
  FrameFormInterface & T
> {
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
