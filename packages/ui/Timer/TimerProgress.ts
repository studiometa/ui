import { Timer } from './Timer.js';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

/**
 * TimerProgress class.
 *
 * A `Timer` that additionally emits a smooth, pause-aware `timer-progress`
 * event on every animation frame, carrying a `0 → 1` ratio in its detail. It is
 * a separate component so the base `Timer` never pays the per-frame cost: mount
 * `TimerProgress` only where a continuous indicator (e.g. a progress bar) is
 * needed.
 *
 * The frame loop is the shared `ticked` RafService, enabled only while a
 * countdown is armed — so it is throttled with every other component and torn
 * down automatically on destroy.
 *
 * @link https://ui.studiometa.dev/components/Timer/
 */
export class TimerProgress<T extends BaseProps = BaseProps> extends Timer<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'TimerProgress',
    emits: ['timer-progress'],
  };

  /**
   * Neutralize the RafService that auto-enables on mount because `ticked`
   * exists: progress must only run while a countdown is armed, so `__arm` and
   * `__clear` own the enabling from there on.
   */
  mounted() {
    this.$services.disable('ticked');
    super.mounted();
  }

  /**
   * Emit the current progress ratio on every animation frame while running.
   */
  ticked() {
    const consumed = this.__elapsed + (performance.now() - this.__armedAt);
    const ratio = Math.min(1, Math.max(0, consumed / (this.__duration || 1)));
    this.__dispatch('timer-progress', ratio);
  }

  /**
   * Enable the progress loop alongside the countdown.
   * @protected
   */
  __arm(delay: number) {
    super.__arm(delay);
    this.$services.enable('ticked');
  }

  /**
   * Report full progress and stop the loop before the countdown completes.
   * @protected
   */
  __complete() {
    this.$services.disable('ticked');
    this.__dispatch('timer-progress', 1);
    super.__complete();
  }

  /**
   * Disable the progress loop together with the countdown.
   * @protected
   */
  __clear() {
    super.__clear();
    this.$services.disable('ticked');
  }

  /**
   * Stop the countdown and reset the reported progress to zero.
   */
  stop() {
    super.stop();
    this.__dispatch('timer-progress', 0);
  }
}
