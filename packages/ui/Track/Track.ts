import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export interface TrackProps extends BaseProps {
  $refs: {
    payload: HTMLScriptElement;
  };
  $options: {
    viewedEvent: string;
    clickedEvent: string;
  };
}

/**
 * Track class.
 *
 * Publish Shopify analytics events when the root element enters the viewport
 * for the first time or when it is clicked.
 * @link https://ui.studiometa.dev/components/Track/
 */
export class Track<T extends BaseProps = BaseProps> extends withIntersectionObserver<Base>(Base, {
  threshold: 0,
})<T & TrackProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'Track',
    refs: ['payload'],
    options: {
      viewedEvent: {
        type: String,
        default: 'bento_section_viewed',
      },
      clickedEvent: {
        type: String,
        default: 'bento_section_clicked',
      },
    },
  };

  /**
   * Whether the viewed event has already been published.
   */
  hasBeenViewed = false;

  /**
   * Payload parsed from the `<script data-ref="payload">` element.
   */
  get payload(): Record<string, unknown> {
    try {
      return JSON.parse(this.$refs.payload.textContent);
    } catch {
      this.$warn('Invalid payload JSON');
      return {};
    }
  }

  /**
   * Publish an event with the Shopify analytics API.
   */
  publish(name: string, payload: Record<string, unknown>) {
    // @ts-expect-error the `Shopify` global is only available on Shopify storefronts.
    const shopify = window.Shopify;

    if (typeof shopify?.analytics?.publish !== 'function') {
      this.$warn('The `Shopify.analytics.publish` API is not available');
      return;
    }

    shopify.analytics.publish(name, payload);
  }

  /**
   * Publish the viewed event the first time the root element enters the viewport.
   */
  intersected([entry]: IntersectionObserverEntry[]) {
    if (!entry.isIntersecting || this.hasBeenViewed) {
      return;
    }

    this.hasBeenViewed = true;
    this.publish(this.$options.viewedEvent, { ...this.payload });
  }

  /**
   * Publish the clicked event with information on the click target.
   */
  onClick({ event }: { event: MouseEvent }) {
    const target = event.target as HTMLElement;

    this.publish(this.$options.clickedEvent, {
      ...this.payload,
      url: window.location.href,
      target: target.tagName.toLowerCase(),
      target_content: (target.textContent ?? '').trim().slice(0, 100),
    });
  }
}
