import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { viewTransition } from '../ViewTransition/index.js';

export interface ToasterShowOptions {
  /**
   * The toast kind. `error` routes the toast to the assertive live region so it
   * interrupts the screen reader; anything else goes to the polite one. The
   * value is mirrored on the toast as `data-type` for styling.
   */
  type?: string;
  /**
   * How long the toast stays before it auto-dismisses, in milliseconds. Pass `0`
   * for a sticky toast that only closes on demand. Defaults to the `duration`
   * option.
   */
  duration?: number;
}

export interface ToasterProps extends BaseProps {
  $refs: {
    polite: HTMLElement;
    assertive: HTMLElement;
    template: HTMLTemplateElement;
  };
  $options: {
    duration: number;
  };
}

/**
 * Running counter for the unique `view-transition-name` assigned to each toast.
 * Module-level so names stay unique even when several `Toaster` instances flush
 * into the same transition batch.
 * @private
 */
let count = 0;

/**
 * Toaster class.
 *
 * A headless notifications region. Two permanent `aria-live` regions — declared
 * as the `polite` and `assertive` refs — live in the DOM from mount, so a toast
 * inserted into one is announced by assistive tech without focus ever moving.
 * The class owns only node creation, the pausable auto-dismiss timer and the
 * enter/leave orchestration; the markup, styling and the animation itself are
 * authored in HTML/CSS, exactly like `Dialog`.
 *
 * Each toast is cloned from the `template` ref and gets a unique
 * `view-transition-name`, then appended (or removed) through the shared
 * [`viewTransition`](/reference/items/ViewTransition/) scheduler. Bursts fired in
 * the same tick coalesce into a single coordinated transition; when the View
 * Transitions API is unavailable the mutation runs synchronously.
 *
 * @link https://ui.studiometa.dev/reference/items/Toaster/
 */
export class Toaster<T extends BaseProps = BaseProps> extends Base<T & ToasterProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Toaster',
    refs: ['polite', 'assertive', 'template'],
    emits: ['show', 'dismiss'],
    options: {
      duration: { type: Number, default: 5000 },
    },
  };

  /**
   * Auto-dismiss timers keyed by their toast, so a toast can be cancelled on
   * demand and every pending timer cleared on destroy.
   * @private
   */
  __timers = new Map<HTMLElement, number>();

  /**
   * Show a toast holding the given message.
   */
  show(
    message: string,
    { type = 'info', duration = this.$options.duration }: ToasterShowOptions = {},
  ): HTMLElement {
    const region =
      type === 'error' ? (this.$refs.assertive ?? this.$refs.polite) : this.$refs.polite;
    const toast = this.$refs.template.content.firstElementChild!.cloneNode(true) as HTMLElement;

    toast.dataset.type = type;
    count += 1;
    toast.style.setProperty('view-transition-name', `toaster-${count}`);

    const messageTarget = toast.querySelector('[data-message]');
    if (messageTarget) {
      messageTarget.textContent = message;
    }

    toast.querySelector('[data-close]')?.addEventListener('click', () => this.dismiss(toast));

    this.$emit('show', toast, message, type);
    viewTransition(() => region.append(toast));

    if (duration > 0) {
      this.__autoDismiss(toast, duration);
    }

    return toast;
  }

  /**
   * Dismiss a toast returned by `show()`. A no-op once the toast is gone.
   */
  dismiss(toast: HTMLElement): void {
    if (!toast.isConnected) {
      return;
    }

    const timer = this.__timers.get(toast);
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    this.__timers.delete(toast);

    this.$emit('dismiss', toast);
    viewTransition(() => toast.remove());
  }

  /**
   * Arm a pausable auto-dismiss timer on the toast: it pauses while the pointer
   * hovers or the focus is within the toast, and resumes on leave/blur, so a
   * toast the user is reading or acting on never disappears under them.
   * @private
   */
  __autoDismiss(toast: HTMLElement, duration: number): void {
    let remaining = duration;
    let start = performance.now();

    const arm = () => {
      start = performance.now();
      this.__timers.set(toast, window.setTimeout(() => this.dismiss(toast), Math.max(remaining, 0)));
    };
    const disarm = () => {
      const timer = this.__timers.get(toast);
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
    const pause = () => {
      disarm();
      remaining -= performance.now() - start;
    };
    const resume = () => {
      disarm();
      arm();
    };

    toast.addEventListener('mouseenter', pause);
    toast.addEventListener('mouseleave', resume);
    toast.addEventListener('focusin', pause);
    toast.addEventListener('focusout', resume);

    arm();
  }

  /**
   * Clear every pending timer so none fires after the component is torn down.
   */
  destroyed() {
    for (const timer of this.__timers.values()) {
      window.clearTimeout(timer);
    }
    this.__timers.clear();
  }
}

export default Toaster;
