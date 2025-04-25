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
   * @todo test modifier keys on click
   */
  onClick({ event }: { event: MouseEvent; target: FrameAnchor }) {
    this.$log('click');
    event.preventDefault();
    this.fetch();
  }
}
