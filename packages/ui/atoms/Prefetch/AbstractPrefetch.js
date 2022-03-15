import { Base } from '@studiometa/js-toolkit';

/**
 * @typedef {{ prefetch: boolean }} PrefetchOptions
 */

/**
 * @typedef {AbstractPrefetch & {
 *   $options: PrefetchOptions
 * }} AbstractPrefetchInterface
 */

/**
 * AbstractPrefetch class.
 */
export default class AbstractPrefetch extends Base {
  /**
   * Config.
   */
  static config = {
    name: 'AbstractPrefetch',
    options: {
      prefetch: {
        type: Boolean,
        default: true,
      },
    },
  };

  /**
   * Store prefetched URL.
   * @type {Set<string>}
   */
  static prefetchedUrls = new Set();

  /**
   * Is the given anchor prefetchable?
   * @param   {URL}  url
   * @param   {PrefetchOptions} options
   * @returns {boolean}
   */
  isPrefetchable(url, options) {
    if (!url || !url.href) {
      return false;
    }

    if (!options.prefetch) {
      return false;
    }

    if (url.origin !== window.location.origin) {
      return false;
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    if (url.protocol === 'http:' && window.location.protocol === 'https:') {
      return false;
    }

    if (
      url.hash &&
      url.pathname + url.search === window.location.pathname + window.location.search
    ) {
      return false;
    }

    return true;
  }

  /**
   * Prefetch the given URL and terminate the component.
   *
   * @this  {AbstractPrefetchInterface}
   * @param {URL} url
   * @returns {void}
   */
  prefetch(url) {
    if (AbstractPrefetch.prefetchedUrls.has(url.href)) {
      return;
    }

    if (!this.isPrefetchable(url, this.$options)) {
      return;
    }

    const prefetcher = document.createElement('link');
    prefetcher.rel = 'prefetch';
    prefetcher.href = url.href;
    document.head.appendChild(prefetcher);

    AbstractPrefetch.prefetchedUrls.add(url.href);

    this.$terminate();
  }
}
