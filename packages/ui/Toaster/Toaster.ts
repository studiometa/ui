import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Toast } from './Toast.js';
import { viewTransition } from '../ViewTransition/index.js';

export interface ToasterShowOptions {
  /**
   * The toast kind. `error` routes the toast to the assertive live region so it
   * interrupts the screen reader; anything else goes to the polite one. The
   * value is mirrored on the toast as `data-type` for styling.
   */
  type?: string;
  /**
   * How long the toast stays before it auto-dismisses, in seconds. Pass `0` for
   * a sticky toast that only closes on demand. Defaults to the `duration`
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
 *
 * The class is only a factory: it clones a toast from the `template` ref, fills
 * in the message, type and a unique `view-transition-name`, then appends it to
 * the matching region through the shared
 * [`viewTransition`](/reference/items/ViewTransition/) scheduler. Everything
 * else belongs to the [`Toast`](/reference/items/Toaster/) it inserts — the
 * auto-dismiss countdown, pausing on hover/focus and the leave animation — which
 * the js-toolkit registry mounts and destroys automatically. Bursts fired in the
 * same tick coalesce into a single coordinated transition.
 *
 * @link https://ui.studiometa.dev/reference/items/Toaster/
 */
export class Toaster<T extends BaseProps = BaseProps> extends Base<T & ToasterProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Toaster',
    // `Toast` lives inside the Toaster; declaring it as a child registers it,
    // so the registry mounts every toast the factory inserts.
    components: { Toast },
    refs: ['polite', 'assertive', 'template'],
    emits: ['show'],
    options: {
      // In seconds, matching the Timer/TimerProgress convention.
      duration: { type: Number, default: 5 },
    },
  };

  /**
   * Show a toast holding the given message, and return its (not-yet-mounted)
   * element. The inserted toast is a `Toast` component the registry mounts on
   * append; it owns its own dismissal.
   */
  show(
    message: string,
    { type = 'info', duration = this.$options.duration }: ToasterShowOptions = {},
  ): HTMLElement {
    const region =
      type === 'error' ? (this.$refs.assertive ?? this.$refs.polite) : this.$refs.polite;
    const toast = this.$refs.template.content.firstElementChild!.cloneNode(true) as HTMLElement;

    // Guarantee the clone is a `Toast`, whatever the template declares, so the
    // registry mounts it. Composes with any other component already on the root.
    const components = new Set((toast.dataset.component ?? '').split(' ').filter(Boolean));
    components.add('Toast');
    toast.dataset.component = [...components].join(' ');

    toast.dataset.type = type;
    count += 1;
    toast.style.setProperty('view-transition-name', `toaster-${count}`);

    const messageTarget = toast.querySelector('[data-message]');
    if (messageTarget) {
      messageTarget.textContent = message;
    }

    // The toast is a `Toast` (a `Timer`): its `delay` is the lifetime, in
    // seconds. A duration of 0 (or less) means sticky — disable the autostart so
    // the countdown never runs and only the close control dismisses it.
    if (duration > 0) {
      toast.dataset.optionDelay = String(duration);
    } else {
      toast.setAttribute('data-option-no-autostart', '');
    }

    this.$emit('show', toast, message, type);
    viewTransition(() => region.append(toast));

    return toast;
  }
}

export default Toaster;
