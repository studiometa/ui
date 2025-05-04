import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export interface AbstractFrameTriggerProps extends BaseProps {
  $el: HTMLFormElement | HTMLAnchorElement;
  $options: {
    requestInit: RequestInit;
    headers: Record<string, string>;
  };
}

/**
 * AbstractFrameTrigger class.
 * @todo add `frame-fetch`, `frame-content`, `frame-error` (and maybe more) events to be able to listen to specific
 * requests with the `Action` component
 */
export class AbstractFrameTrigger<T extends BaseProps = BaseProps> extends Base<
  T & AbstractFrameTriggerProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractFrameTrigger',
    emits: ['frame-trigger'],
    options: {
      requestInit: Object,
      headers: Object,
    },
  };

  /**
   * The URL to use for the request.
   */
  get url(): URL {
    return new URL(this.$el instanceof HTMLFormElement ? this.$el.action : this.$el.href);
  }

  /**
   * Option for the fetch request.
   */
  get requestInit(): RequestInit {
    const { requestInit, headers } = this.$options;

    return {
      ...requestInit,
      headers: {
        ...requestInit.headers,
        ...headers,
      },
    };
  }

  /**
   * Trigger request.
   */
  async trigger() {
    const { url, requestInit } = this;
    this.$log('trigger', url, requestInit);
    this.$emit('frame-trigger', url, requestInit);
  }
}
