import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractFrameTrigger } from './AbstractFrameTrigger.js';

export interface FrameAnchorProps extends BaseProps {
  $el: HTMLAnchorElement;
}

/**
 * FrameAnchor class.
 */
export class FrameAnchor<T extends BaseProps = BaseProps> extends AbstractFrameTrigger<
  T & FrameAnchorProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'FrameAnchor',
  };

  /**
   * Prevent click.
   */
  onClick({ event }: { event: MouseEvent; target: FrameAnchor }) {
    if (
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !event.metaKey &&
      event.button === 0 &&
      this.$el.target !== '_blank'
    ) {
      event.preventDefault();
      this.trigger();
    }
  }
}
