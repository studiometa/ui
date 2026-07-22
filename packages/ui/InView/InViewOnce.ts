import type { BaseConfig } from '@studiometa/js-toolkit';
import { InView } from './InView.js';

/**
 * InViewOnce class.
 *
 * A one-shot variant of the `InView` primitive: it emits `in-view` a single
 * time when the element enters the viewport, then terminates. The
 * `withMountWhenInView` decorator disconnects its observer on `terminated`, so
 * the event never fires again and no `out-of-view` event is ever emitted.
 *
 * @link https://ui.studiometa.dev/components/InViewOnce/
 */
export class InViewOnce extends InView {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...InView.config,
    name: 'InViewOnce',
    emits: ['in-view'],
  };

  /**
   * Emit `in-view` once, then terminate so the event never fires again.
   */
  mounted() {
    this.$emit('in-view');
    this.$terminate();
  }

  /**
   * Suppress the inherited `out-of-view` emission: `$terminate()` triggers the
   * `destroyed()` hook, but a one-shot component must never emit `out-of-view`.
   */
  destroyed() {
    // no-op
  }
}
