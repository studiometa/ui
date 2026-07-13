import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractTrack } from './AbstractTrack.js';
import type { AbstractTrackProps } from './AbstractTrack.js';

declare global {
  interface Window {
    Shopify?: {
      analytics?: {
        publish?: (event: string, payload: Record<string, unknown>) => void;
      };
    };
  }
}

export interface TrackShopifyProps extends AbstractTrackProps {}

/**
 * TrackShopify class.
 *
 * A declarative analytics tracking component for Shopify storefronts. It
 * publishes the resolved payload through the `window.Shopify.analytics.publish`
 * API, using the payload's `event` key as the event name.
 *
 * @link https://ui.studiometa.dev/components/Track/
 *
 * @example
 * ```html
 * <button
 *   data-component="TrackShopify"
 *   data-track:click='{"event": "add_to_cart", "product_id": "123"}'>
 *   Add to Cart
 * </button>
 * ```
 */
export class TrackShopify<T extends BaseProps = BaseProps> extends AbstractTrack<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractTrack.config,
    name: 'TrackShopify',
  };

  /**
   * Publish the resolved payload through `window.Shopify.analytics.publish`.
   */
  dispatch(payload: Record<string, unknown>): void {
    const analytics = typeof window === 'undefined' ? undefined : window.Shopify?.analytics;

    if (!analytics || typeof analytics.publish !== 'function') {
      this.$warn('`window.Shopify.analytics.publish` is not available.');
      return;
    }

    if (typeof payload.event !== 'string') {
      this.$warn('Cannot publish a tracking event without a string `event` name.');
      return;
    }

    // Called as a method so `this` stays bound to `window.Shopify.analytics`.
    analytics.publish(payload.event, payload);
  }
}
