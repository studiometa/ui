import { withMountWhenInView } from '@studiometa/js-toolkit/withMountWhenInView';
import type { BaseConfig } from '@studiometa/js-toolkit';
import { AbstractPrefetch } from './AbstractPrefetch.js';

/**
 * PrefetchWhenVisible class.
 *
 * An `AbstractPrefetch` using the `withMountWhenInView` decorator so it mounts
 * only when the link enters the viewport, prefetching its URL on mount.
 *
 * @link https://ui.studiometa.dev/reference/items/Prefetch/
 */
export class PrefetchWhenVisible extends withMountWhenInView<AbstractPrefetch>(AbstractPrefetch) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractPrefetch.config,
    name: 'PrefetchWhenVisible',
  };

  /**
   * Prefetch on mount.
   */
  mounted() {
    this.prefetch();
  }
}
