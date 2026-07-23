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
   * The pending `requestAnimationFrame` identifier, or `null` when idle.
   * @private
   */
  __frame: number | null = null;

  /**
   * Start the progress loop alongside the countdown.
   * @protected
   */
  __arm(delay: number) {
    super.__arm(delay);
    this.__loop();
  }

  /**
   * Report full progress and stop the loop before the countdown completes.
   * @protected
   */
  __complete() {
    this.__stopFrame();
    this.__dispatch('timer-progress', 1);
    super.__complete();
  }

  /**
   * Cancel the pending animation frame together with the countdown.
   * @protected
   */
  __clear() {
    super.__clear();
    this.__stopFrame();
  }

  /**
   * Stop the countdown and reset the reported progress to zero.
   */
  stop() {
    super.stop();
    this.__dispatch('timer-progress', 0);
  }

  /**
   * Emit the current progress ratio on every animation frame.
   * @private
   */
  __loop() {
    this.__stopFrame();

    const step = () => {
      const consumed = this.__elapsed + (performance.now() - this.__armedAt);
      const ratio = Math.min(1, Math.max(0, consumed / (this.__duration || 1)));
      this.__dispatch('timer-progress', ratio);
      this.__frame = window.requestAnimationFrame(step);
    };

    this.__frame = window.requestAnimationFrame(step);
  }

  /**
   * Cancel the pending animation frame.
   * @private
   */
  __stopFrame() {
    if (this.__frame !== null) {
      window.cancelAnimationFrame(this.__frame);
    }

    this.__frame = null;
  }
}
