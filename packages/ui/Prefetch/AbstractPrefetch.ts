import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';

export interface AbstractPrefetchProps extends BaseProps {
  $el: HTMLAnchorElement;
  $options: {
    prefetch: boolean;
  };
}

/**
 * AbstractPrefetch class.
 */
export class AbstractPrefetch<T extends BaseProps = BaseProps> extends Base<
  T & AbstractPrefetchProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
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
   */
  static prefetchedUrls: Set<string> = new Set();

  /**
   * Is the given anchor prefetchable?
   */
  isPrefetchable(url: URL): boolean {
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
   */
  prefetch(url: URL) {
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
