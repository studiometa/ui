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
    emits: ['prefetched'],
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
   * URL to prefetch.
   */
  get url(): URL | null {
    const { href } = this.$el;
    return href ? new URL(href) : null;
  }

  /**
   * Is the given anchor prefetchable?
   */
  get isPrefetchable(): boolean {
    const { url } = this;

    if (!url || !url.href) {
      return false;
    }

    if (!this.$options.prefetch) {
      return false;
    }

    if (url.origin !== window.location.origin) {
      return false;
    }

    if (url.href === window.location.href) {
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
  prefetch() {
    const { url } = this;

    if (AbstractPrefetch.prefetchedUrls.has(url.href)) {
      return;
    }

    if (!this.isPrefetchable) {
      return;
    }

    const prefetcher = document.createElement('link');
    prefetcher.rel = 'prefetch';
    prefetcher.href = url.href;
    prefetcher.addEventListener('load', () => this.$emit('prefetched', url));
    document.head.append(prefetcher);

    AbstractPrefetch.prefetchedUrls.add(url.href);
  }
}
