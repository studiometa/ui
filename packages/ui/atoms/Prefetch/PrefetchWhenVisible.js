import { withMountWhenInView } from '@studiometa/js-toolkit';
import AbstractPrefetch from './AbstractPrefetch.js';

/**
 * @typedef {PrefetchWhenVisible & {
 *   $el: HTMLAnchorElement
 * }} PrefetchWhenVisibleInterface
 */

/**
 * PrefetchWhenVisible class.
 */
export default class PrefetchWhenVisible extends withMountWhenInView(AbstractPrefetch) {
  /**
   * Config.
   */
  static config = {
    ...AbstractPrefetch.config,
    name: 'PrefetchWhenVisible',
  };

  /**
   * Prefetch on mount.
   *
   * @this    {PrefetchWhenVisibleInterface}
   * @returns {void}
   */
  mounted() {
    this.prefetch(new URL(this.$el.href));
  }
}
