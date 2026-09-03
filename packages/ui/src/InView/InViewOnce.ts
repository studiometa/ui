import type { BaseConfig } from '@studiometa/js-toolkit';
import { InView } from './InView.js';

/** One-shot variant of {@link InView}; emits only `in-view`. */
export class InViewOnce extends InView {
  static config: BaseConfig = {
    name: 'InViewOnce',
    mountStrategy: 'visible',
  };

  /** Suppress `out-of-view`, including when the element is removed. */
  unmounted(): void {
    // no-op
  }
}
