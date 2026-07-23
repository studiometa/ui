import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface TimerProps extends BaseProps {
  $options: {
    delay: number;
    repeat: boolean;
    autostart: boolean;
  };
}

/**
 * Timer class.
 *
 * A headless, composable countdown primitive. It emits DOM events for its
 * lifecycle and exposes imperative methods, holding no UI state of its own —
 * combine it with `Action` (to react to `timer-*` events or call its methods)
 * and the `Data*` family (to turn those events into reactive state).
 *
 * Events bubble, so an ancestor `Action` can catch and route them; use the
 * `.stop` event modifier to contain them in nested setups.
 *
 * @link https://ui.studiometa.dev/components/Timer/
 */
export class Timer<T extends BaseProps = BaseProps> extends Base<TimerProps & T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Timer',
    emits: ['timer-start', 'timer-end', 'timer-tick', 'timer-pause', 'timer-resume', 'timer-stop'],
    options: {
      delay: { type: Number, default: 0 },
      repeat: Boolean,
      autostart: { type: Boolean, default: true },
    },
  };

  /**
   * The pending `setTimeout` identifier, or `null` when idle.
   * @private
   */
  __timer: number | null = null;

  /**
   * Timestamp (ms) at which the current countdown segment was armed.
   * @protected
   */
  __armedAt = 0;

  /**
   * Time (ms) already consumed before the current segment, preserved across pauses.
   * @protected
   */
  __elapsed = 0;

  /**
   * Time (ms) left to wait before the countdown completes.
   * @private
   */
  __remaining = 0;

  /**
   * Whether a countdown is currently paused and can be resumed.
   * @private
   */
  __paused = false;

  /**
   * Start the countdown on mount unless `autostart` is disabled.
   */
  mounted() {
    if (this.$options.autostart) {
      this.start();
    }
  }

  /**
   * Cancel any pending countdown on destroy.
   */
  destroyed() {
    this.__clear();
  }

  /**
   * The total countdown duration in milliseconds (the `delay` option is in seconds).
   * @protected
   */
  get __duration(): number {
    return this.$options.delay * 1000;
  }

  /**
   * Dispatch a bubbling event so an ancestor `Action` can catch and route it.
   * @private
   */
  __dispatch(name: string, ...detail: unknown[]) {
    this.$emit(new CustomEvent(name, { detail, bubbles: true }));
  }

  /**
   * Start — or restart — the countdown from the beginning.
   */
  start() {
    this.__clear();
    this.__paused = false;
    this.__elapsed = 0;
    this.__remaining = this.__duration;
    this.__dispatch('timer-start');
    this.__arm(this.__remaining);
  }

  /**
   * Alias for `start()`, restarting the countdown from zero.
   */
  restart() {
    this.start();
  }

  /**
   * Stop the countdown without completing it.
   */
  stop() {
    this.__clear();
    this.__paused = false;
    this.__remaining = 0;
    this.__dispatch('timer-stop');
  }

  /**
   * Pause the countdown, preserving the remaining time.
   */
  pause() {
    if (this.__timer === null) {
      return;
    }

    const consumed = performance.now() - this.__armedAt;
    this.__elapsed += consumed;
    this.__remaining -= consumed;
    this.__clear();
    this.__paused = true;
    this.__dispatch('timer-pause');
  }

  /**
   * Resume a paused countdown from where it left off.
   */
  resume() {
    if (!this.__paused) {
      return;
    }

    this.__paused = false;
    this.__dispatch('timer-resume');
    this.__arm(this.__remaining);
  }

  /**
   * Arm the countdown for the given duration in milliseconds.
   * @protected
   */
  __arm(delay: number) {
    this.__armedAt = performance.now();
    this.__timer = window.setTimeout(() => this.__complete(), delay);
  }

  /**
   * Handle the countdown reaching zero, re-arming when `repeat` is enabled.
   * @protected
   */
  __complete() {
    this.__timer = null;
    this.__dispatch('timer-end');

    if (this.$options.repeat) {
      this.__dispatch('timer-tick');
      this.start();
    }
  }

  /**
   * Cancel any pending countdown. Subclasses extend this to release extra resources.
   * @protected
   */
  __clear() {
    if (this.__timer !== null) {
      window.clearTimeout(this.__timer);
    }

    this.__timer = null;
  }
}
