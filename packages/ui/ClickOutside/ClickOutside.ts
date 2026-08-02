import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps, BaseEventHookParams } from '@studiometa/js-toolkit';

export interface ClickOutsideProps extends BaseProps {}

/**
 * ClickOutside class.
 *
 * A minimal marker component that reports clicks landing outside its own element.
 * Using the built-in `onDocumentClick` hook, it dispatches a native
 * `click-outside` `CustomEvent` on its root element whenever a document click
 * occurs outside of it. Paired with the `Action` component on the same element,
 * this lets HTML react to outside clicks — closing a dropdown or popover for
 * example — via `data-on:click-outside="..."` without writing any JavaScript.
 *
 * @link https://ui.studiometa.dev/reference/items/ClickOutside/
 */
export class ClickOutside<T extends BaseProps = BaseProps> extends Base<ClickOutsideProps & T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'ClickOutside',
  };

  /**
   * Dispatch a `click-outside` event when a document click lands outside the element.
   */
  onDocumentClick({ event }: BaseEventHookParams<MouseEvent>) {
    if (!event.composedPath().includes(this.$el)) {
      this.$el.dispatchEvent(new CustomEvent('click-outside', { detail: { event } }));
    }
  }
}

export default ClickOutside;
