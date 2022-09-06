import { withMountWhenInView } from '@studiometa/js-toolkit';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { AbstractPrefetch } from './AbstractPrefetch.js';

/**
 * PrefetchWhenVisible class.
 */
export class PrefetchWhenVisible extends withMountWhenInView<AbstractPrefetch>(AbstractPrefetch) {
  /**
   * Config.
   */
  static config:BaseConfig = {
    ...AbstractPrefetch.config,
    name: 'PrefetchWhenVisible',
  };

  /**
   * Prefetch on mount.
   */
  mounted() {
    this.prefetch(new URL(this.$el.href));
  }
}
