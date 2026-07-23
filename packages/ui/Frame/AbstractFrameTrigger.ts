import { Base, getClosestParent } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { FrameRequestInit } from './types.js';
import { EVENTS } from './utils.js';
import { FrameTriggerLoader } from './FrameTriggerLoader.js';

export interface AbstractFrameTriggerProps extends BaseProps {
  $el: HTMLFormElement | HTMLAnchorElement;
  $options: {
    requestInit: RequestInit;
    headers: Record<string, string>;
  };
  $children: {
    FrameTriggerLoader: FrameTriggerLoader[];
  };
}

/**
 * AbstractFrameTrigger class.
 *
 * The shared base for the Frame navigation triggers (`FrameAnchor` and `FrameForm`). It
 * resolves the request URL and `requestInit` from the root element, exposes a `trigger()`
 * method that emits the `frame-trigger` event consumed by the parent `Frame`, and drives
 * its `FrameTriggerLoader` children during the request lifecycle.
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
    components: {
      FrameTriggerLoader,
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
   * Trigger FrameLoaders enter.
   */
  onFrameFetchBefore() {
    if (this.$children.FrameTriggerLoader) {
      for (const loader of this.$children.FrameTriggerLoader) {
        if (getClosestParent(loader, this.constructor) === this) {
          loader.enter();
        }
      }
    }
  }

  /**
   * Trigger FrameLoaders leave.
   */
  onFrameFetchAfter() {
    if (this.$children.FrameTriggerLoader) {
      for (const loader of this.$children.FrameTriggerLoader) {
        if (getClosestParent(loader, this.constructor) === this) {
          loader.leave();
        }
      }
    }
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
