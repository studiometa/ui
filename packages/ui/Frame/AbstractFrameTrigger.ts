import { Base, getClosestParent } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { Frame } from './Frame.js';

export interface AbstractFrameTriggerProps extends BaseProps {
  $el: HTMLFormElement | HTMLAnchorElement;
  $options: {
    requestInit: RequestInit;
    headers: Record<string, string>;
    history: boolean;
  };
}

/**
 * AbstractFrameTrigger class.
 */
export class AbstractFrameTrigger<T extends BaseProps = BaseProps> extends Base<
  T & AbstractFrameTriggerProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractFrameTrigger',
    emits: ['frame-fetch', 'frame-content', 'frame-error'],
    options: {
      requestInit: Object,
      headers: Object,
      history: Boolean,
    },
  };

  /**
   * The client used for the fetch request.
   */
  get client(): typeof fetch {
    return window.fetch.bind(window);
  }

  /**
   * The parent Frame.
   */
  get frame(): Frame {
    return getClosestParent(this, this.$parent.constructor as typeof Frame);
  }

  /**
   * The URL to use for the request.
   */
  get url(): string | URL {
    return this.$el instanceof HTMLFormElement ? this.$el.action : this.$el.href;
  }

  /**
   * Option for the fetch request.
   */
  get requestInit(): RequestInit {
    const requestedBy = '@studiometa/ui/Frame';

    return {
      ...this.$options.requestInit,
      headers: {
        Accept: 'text/*',
        'X-Requested-By': requestedBy,
        'User-Agent': `${navigator.userAgent} ${requestedBy}`,
        ...this.$options.requestInit.headers,
        ...this.$options.headers,
      },
    };
  }

  async fetch() {
    const { requestInit } = this;
    const url = new URL(this.url);
    this.$log('fetch', url, requestInit);
    this.$emit('frame-fetch', url, requestInit);

    this.frame.abortController.abort();
    this.frame.abortController = new AbortController();
    requestInit.signal = this.frame.abortController.signal;

    try {
      const content = await this.client(url, requestInit).then((response) => response.text());
      this.content(url, content);
    } catch (error) {
      this.error(url, error);
    }
  }

  async content(url: URL, content: string) {
    this.$log('content', url, content);
    this.$emit('frame-content', url, content);
  }

  async error(url: URL, error: Error) {
    this.$log('error', url, error);
    this.$emit('frame-error', url, error);
  }
}
