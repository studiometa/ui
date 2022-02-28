import { withMountWhenInView } from '@studiometa/js-toolkit';
import AbstractPrefetch from './AbstractPrefetch.js';

/**
 * PrefetchWhenVisible class.
 */
export default class PrefetchWhenVisible extends withMountWhenInView(AbstractPrefetch) {
  /**
   * Config.
   */
  static config = {
    name: 'PrefetchWhenVisible',
  };

  /**
   * Prefetch on mount.
   *
   * @returns {void}
   */
  mounted() {
    this.prefetch(new URL(this.$el.href));
  }
}
