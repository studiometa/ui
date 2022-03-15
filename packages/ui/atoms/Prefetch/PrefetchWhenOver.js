import AbstractPrefetch from './AbstractPrefetch.js';

/**
 * @typedef {PrefetchWhenOver & {
 *   $el: HTMLAnchorElement
 * }} PrefetchWhenOverInterface
 */

/**
 * PrefetchWhenOver class.
 */
export default class PrefetchWhenOver extends AbstractPrefetch {
  /**
   * Config.
   */
  static config = {
    ...AbstractPrefetch.config,
    name: 'PrefetchWhenOver',
  };

  /**
   * Prefetch on mouseenter.
   *
   * @this    {PrefetchWhenOverInterface}
   * @returns {void}
   */
  onMouseenter() {
    this.prefetch(new URL(this.$el.href));
  }
}
