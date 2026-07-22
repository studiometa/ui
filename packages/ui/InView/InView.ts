import { Base, withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';

/**
 * InView class.
 *
 * A primitive emitting directional viewport events: `in-view` when the element
 * enters the viewport and `out-of-view` when it leaves. It is built on the
 * `withMountWhenInView` decorator, whose mount/destroy lifecycle maps directly
 * to the enter/leave transitions.
 *
 * By default the primitive is one-shot: it emits `in-view` once and terminates.
 * Set the `repeat` option to re-emit `in-view`/`out-of-view` on each viewport
 * crossing.
 *
 * @link https://ui.studiometa.dev/components/InView/
 */
export class InView extends withMountWhenInView(Base) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'InView',
    emits: ['in-view', 'out-of-view'],
    options: {
      repeat: Boolean,
    },
  };

  /**
   * Whether the component is terminating after a one-shot `in-view` emission,
   * used to skip the `out-of-view` emission triggered by `$terminate()`.
   *
   * @private
   */
  __oneShot = false;

  /**
   * Emit the `in-view` event when the element enters the viewport.
   */
  mounted() {
    this.$emit('in-view');

    if (!this.$options.repeat) {
      this.__oneShot = true;
      this.$terminate();
    }
  }

  /**
   * Emit the `out-of-view` event when the element leaves the viewport, unless
   * the destroy was triggered by the one-shot `$terminate()`.
   */
  destroyed() {
    if (this.__oneShot) {
      return;
    }

    this.$emit('out-of-view');
  }
}
