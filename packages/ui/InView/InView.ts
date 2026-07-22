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
 * @link https://ui.studiometa.dev/components/InView/
 */
export class InView extends withMountWhenInView(Base) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'InView',
    emits: ['in-view', 'out-of-view'],
  };

  /**
   * Emit the `in-view` event when the element enters the viewport.
   */
  mounted() {
    this.$emit('in-view');
  }

  /**
   * Emit the `out-of-view` event when the element leaves the viewport.
   */
  destroyed() {
    this.$emit('out-of-view');
  }
}
