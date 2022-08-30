import { Base } from '@studiometa/js-toolkit';

/**
 * @typedef {import('@studiometa/js-toolkit').BaseTypeParameter} BaseTypeParameter
 * @typedef {{
 *   $el: HTMLAnchorElement
 *   $options: { prefetch: boolean },
 * }} AbstractPrefetchInterface
 */

/**
 * AbstractPrefetch class.
 * @template {BaseTypeParameter} [Interface={}]
 * @extends {Base<AbstractPrefetchInterface>}
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
   * @returns {boolean}
   */
  isPrefetchable(url) {
    if (!url || !url.href) {
      return false;
    }

    if (!this.$options.prefetch) {
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
   * @param {URL} url
   * @returns {void}
   */
  prefetch(url) {
    if (AbstractPrefetch.prefetchedUrls.has(url.href)) {
      return;
    }

    if (!this.isPrefetchable(url)) {
      return;
    }

    const prefetcher = document.createElement('link');
    prefetcher.rel = 'prefetch';
    prefetcher.href = url.href;
    document.head.append(prefetcher);

    AbstractPrefetch.prefetchedUrls.add(url.href);

    this.$terminate();
  }
}
