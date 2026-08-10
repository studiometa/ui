import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractFrameTrigger } from './AbstractFrameTrigger.js';

export interface FrameAnchorProps extends BaseProps {
  $el: HTMLAnchorElement;
}

/**
 * FrameAnchor class.
 *
 * The link trigger of the Frame navigation system. Bound to an `<a>` element, it prevents
 * the default navigation on a plain left click (ignoring modifier keys and `target="_blank"`)
 * and calls `trigger()` to have the parent `Frame` fetch the link's `href` instead.
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
