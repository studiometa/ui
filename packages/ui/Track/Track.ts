import { Base, getClosestParent } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { TrackContext } from './TrackContext.js';
import { TrackEvent } from './TrackEvent.js';
import { getTrackDispatcher } from './dispatcher.js';

export interface TrackProps extends BaseProps {
  $options: {
    threshold: number;
  };
}

/**
 * Track class.
 *
 * A declarative component for analytics tracking, compatible with GTM/dataLayer,
 * GA4, Segment, and custom backends.
 *
 * @link https://ui.studiometa.dev/components/Track/
 *
 * @example
 * ```html
 * <!-- Click tracking -->
 * <button
 *   data-component="Track"
 *   data-on:click='{"event": "cta_click", "location": "header"}'>
 *   Subscribe
 * </button>
 *
 * <!-- Page load tracking -->
 * <div
 *   data-component="Track"
 *   data-on:mounted='{"event": "view_item_list", "ecommerce": {"items": [...]}}'
 *   hidden>
 * </div>
 *
 * <!-- Impression tracking -->
 * <div
 *   data-component="Track"
 *   data-on:view.once='{"event": "product_impression", "id": "123"}'>
 *   Product Card
 * </div>
 * ```
 */
export class Track<T extends BaseProps = BaseProps> extends Base<TrackProps & T> {
  static config: BaseConfig = {
    name: 'Track',
    options: {
      threshold: {
        type: Number,
        default: 0.5,
      },
    },
  };

  /**
   * @private
   */
  __trackEvents?: Set<TrackEvent>;

  /**
   * Get all TrackEvent instances parsed from data-on:* attributes.
   */
  get trackEvents(): Set<TrackEvent> {
    if (this.__trackEvents) {
      return this.__trackEvents;
    }

    this.__trackEvents = new Set();

    // Parse data-on:* attributes
    for (let i = 0; i < this.$el.attributes.length; i++) {
      const attr = this.$el.attributes[i];
      if (attr.name.startsWith('data-on:')) {
        const eventDefinition = attr.name.slice(8); // Remove 'data-on:'
        try {
          const data = JSON.parse(attr.value);
          this.__trackEvents.add(new TrackEvent(this, eventDefinition, data));
        } catch (err) {
          this.$warn(`Invalid JSON in ${attr.name}:`, err);
        }
      }
    }

    return this.__trackEvents;
  }

  /**
   * Get context data from closest TrackContext parent.
   */
  get contextData(): Record<string, unknown> {
    const context = getClosestParent(this, TrackContext);
    return context?.$options.data ?? {};
  }

  /**
   * Dispatch tracking data (merged with context).
   *
   * @param data - The tracking data to dispatch
   * @param event - The optional DOM event that triggered the dispatch
   */
  dispatch(data: Record<string, unknown>, event?: Event): void {
    const dispatcher = getTrackDispatcher();
    const mergedData = { ...this.contextData, ...data };
    dispatcher(mergedData, event);
  }

  /**
   * Mounted lifecycle hook.
   */
  mounted() {
    for (const trackEvent of this.trackEvents) {
      if (trackEvent.event === 'mounted') {
        // Dispatch immediately on mount
        this.dispatch(trackEvent.data);
      } else if (trackEvent.event === 'view') {
        // IntersectionObserver for impression tracking
        trackEvent.attachViewEvent();
      } else {
        // Standard DOM event
        trackEvent.attachEvent();
      }
    }
  }

  /**
   * Destroyed lifecycle hook.
   */
  destroyed() {
    for (const trackEvent of this.trackEvents) {
      trackEvent.detachEvent();
    }
  }
}
