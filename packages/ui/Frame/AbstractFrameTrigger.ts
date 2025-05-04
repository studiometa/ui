import { Base } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { FrameRequestInit } from './types.js';
import { EVENTS } from './utils.js';

export interface AbstractFrameTriggerProps extends BaseProps {
  $el: HTMLFormElement | HTMLAnchorElement;
  $options: {
    requestInit: RequestInit;
    headers: Record<string, string>;
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
    emits: Object.values(EVENTS),
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
  get requestInit(): FrameRequestInit {
    const { requestInit, headers } = this.$options;

    return {
      ...requestInit,
      // @ts-expect-error this will be right.
      trigger: this,
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
    this.$emit(EVENTS.TRIGGER, url, requestInit);
  }
}
