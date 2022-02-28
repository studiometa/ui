import AbstractPrefetch from './AbstractPrefetch.js';

/**
 * PrefetchWhenOver class.
 */
export default class PrefetchWhenOver extends AbstractPrefetch {
  /**
   * Config.
   */
  static config = {
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
