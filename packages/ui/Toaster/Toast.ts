import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Timer } from '../Timer/index.js';
import type { TimerProps } from '../Timer/index.js';
import { viewTransition } from '../ViewTransition/index.js';

export interface ToastProps extends TimerProps {
  $refs: {
    close: HTMLElement;
  };
}

/**
 * Toast class.
 *
 * A single, self-contained toast built on the [`Timer`](/reference/items/Timer/)
 * primitive: `Timer` provides the pausable auto-dismiss countdown (its `delay`
 * option is the toast lifetime, in seconds), `autostart` begins it on mount and
 * `destroyed()` clears it for free. This class adds the interaction — pausing
 * while hovered or focused, an optional close control — and animates itself out
 * through the shared [`viewTransition`](/reference/items/ViewTransition/)
 * scheduler when dismissed.
 *
 * It is mounted automatically by the js-toolkit registry when a `Toaster`
 * inserts it, and destroyed automatically when it removes itself — so a
 * `Toaster` never has to track or tear down individual toasts.
 *
 * @link https://ui.studiometa.dev/reference/items/Toaster/
 */
export class Toast<T extends TimerProps = TimerProps> extends Timer<T & ToastProps> {
  /**
   * Config. Merges with `Timer`'s (the `delay`/`autostart`/`repeat` options and
   * `timer-*` events are inherited).
   */
  static config: BaseConfig = {
    name: 'Toast',
    refs: ['close'],
    emits: ['dismiss'],
  };

  /**
   * Whether the toast is already leaving, so a click + timer race dismisses once.
   * @private
   */
  __dismissed = false;

  /**
   * Pause the countdown while the pointer is over the toast.
   */
  onMouseenter() {
    this.pause();
  }

  /**
   * Resume the countdown when the pointer leaves.
   */
  onMouseleave() {
    this.resume();
  }

  /**
   * Pause while the focus is anywhere inside the toast (`focusin`/`focusout`
   * bubble, unlike `focus`/`blur`, so this covers the close control too).
   */
  onFocusin() {
    this.pause();
  }

  /**
   * Resume when the focus leaves the toast.
   */
  onFocusout() {
    this.resume();
  }

  /**
   * Dismiss when the close control is activated.
   */
  onCloseClick() {
    this.dismiss();
  }

  /**
   * Dismiss the toast once the countdown reaches zero.
   * @protected
   */
  __complete() {
    super.__complete();
    this.dismiss();
  }

  /**
   * Animate the toast out and remove it from the DOM; the registry then destroys
   * this component (and `Timer`'s `destroyed()` clears any pending countdown).
   */
  dismiss(): void {
    if (this.__dismissed) {
      return;
    }

    this.__dismissed = true;
    this.__clear();
    this.__dispatch('dismiss', this.$el);
    viewTransition(() => this.$el.remove());
  }
}

export default Toast;
