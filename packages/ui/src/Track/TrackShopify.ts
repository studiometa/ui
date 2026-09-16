import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractTrack, type AbstractTrackProps } from './AbstractTrack.js';

declare global {
  interface Window {
    Shopify?: {
      analytics?: {
        publish?: (event: string, payload: Record<string, unknown>) => void;
      };
      customerPrivacy?: {
        analyticsProcessingAllowed?: () => boolean;
      };
    };
  }
}

export type TrackShopifyProps = AbstractTrackProps;

/**
 * Publishes tracking payloads through `window.Shopify.analytics.publish`.
 *
 * Shopify's Web Pixels Manager gates App Pixels at load time, but it hands
 * every published event to custom pixels, which are expected to apply their
 * own consent logic. This component publishes only when
 * `window.Shopify.customerPrivacy.analyticsProcessingAllowed()` returns
 * `true`, so a storefront does not repeat that check before each event.
 *
 * @example
 * ```html
 * <button data-component="TrackShopify" data-track:click='{"event": "my_app:add_to_cart"}'>Add to cart</button>
 * ```
 */
export class TrackShopify<T extends BaseProps = BaseProps> extends AbstractTrack<T> {
  static config: BaseConfig = {
    name: 'TrackShopify',
  };

  dispatch(payload: Record<string, unknown>): void {
    // Read fresh on every dispatch. The Customer Privacy API is loaded
    // asynchronously through `loadFeatures()` and the visitor can change their
    // choice at any time, so anything resolved at mount would go stale.
    const analytics = window.Shopify?.analytics;

    if (typeof analytics?.publish !== 'function') {
      this.$warn(
        'track.shopify-unavailable',
        '`window.Shopify.analytics.publish` is not available.',
      );
      return;
    }

    if (typeof payload.event !== 'string') {
      this.$warn(
        'track.missing-event-name',
        'Cannot publish a tracking event without a string `event` name.',
      );
      return;
    }

    // Consent is checked last on purpose. The two checks above catch a broken
    // environment and a broken declaration, which are wrong for every visitor,
    // while a consent drop follows one visitor's choice. Checking consent first
    // would hide an authoring mistake behind a legitimate drop.
    const customerPrivacy = window.Shopify?.customerPrivacy;

    if (typeof customerPrivacy?.analyticsProcessingAllowed !== 'function') {
      this.$warn(
        'track.shopify-privacy-unavailable',
        '`window.Shopify.customerPrivacy.analyticsProcessingAllowed` is not available, the event is dropped.',
      );
      return;
    }

    // Called as a method so `this` stays bound to `window.Shopify.customerPrivacy`.
    if (!customerPrivacy.analyticsProcessingAllowed()) {
      this.$warn(
        'track.shopify-consent-denied',
        'Analytics processing is not allowed, the event is dropped.',
      );
      return;
    }

    // Called as a method so `this` stays bound to `window.Shopify.analytics`.
    analytics.publish(payload.event, payload);
  }
}
