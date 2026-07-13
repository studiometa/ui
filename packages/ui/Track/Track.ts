import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractTrack } from './AbstractTrack.js';
import type { AbstractTrackProps } from './AbstractTrack.js';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export interface TrackProps extends AbstractTrackProps {}

/**
 * Track class.
 *
 * A declarative component for analytics tracking, compatible with GTM and any
 * consumer of `window.dataLayer` (GA4, Segment, …). Consent is expected to be
 * handled at the tag level by the tag manager or CMP.
 *
 * @link https://ui.studiometa.dev/components/Track/
 *
 * @example
 * ```html
 * <!-- Click tracking -->
 * <button
 *   data-component="Track"
 *   data-track:click='{"event": "cta_click", "location": "header"}'>
 *   Subscribe
 * </button>
 *
 * <!-- Page load tracking -->
 * <div
 *   data-component="Track"
 *   data-track:mounted='{"event": "view_item_list"}'
 *   hidden>
 *   <script data-ref="payload" type="application/json">
 *     { "ecommerce": { "items": [] } }
 *   </script>
 * </div>
 *
 * <!-- Impression tracking -->
 * <div
 *   data-component="Track"
 *   data-track:view.once='{"event": "product_impression", "id": "123"}'>
 *   Product Card
 * </div>
 * ```
 */
export class Track<T extends BaseProps = BaseProps> extends AbstractTrack<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractTrack.config,
    name: 'Track',
  };

  /**
   * Push the resolved payload to `window.dataLayer`.
   */
  dispatch(payload: Record<string, unknown>): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  }
}
