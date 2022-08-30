import AbstractPrefetch from './AbstractPrefetch.js';

/**
 * @typedef {PrefetchWhenOver & {
 *   $el: HTMLAnchorElement
 * }} PrefetchWhenOverInterface
 */

/**
 * PrefetchWhenOver class.
 * @extends {AbstractPrefetch<{ $el: HTMLAnchorElement }>}
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
   * @returns {void}
   */
  onMouseenter() {
    this.prefetch(new URL(this.$el.href));
  }
}
