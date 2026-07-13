import deepmerge from 'deepmerge';
import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { nextFrame } from '@studiometa/js-toolkit/utils';
import { TrackContext } from './TrackContext.js';
import { TrackEvent } from './TrackEvent.js';

export interface AbstractTrackProps extends BaseProps {
  $refs: {
    payload?: HTMLScriptElement;
  };
  $options: {
    threshold: number;
  };
}

/**
 * Array merge strategy for `deepmerge`: replace the destination array with the
 * source array instead of concatenating. Concatenation is wrong for GA4 style
 * payloads (e.g. `ecommerce.items`), where a more specific layer should fully
 * override the array coming from a broader one.
 */
function arrayMerge(_destination: unknown[], source: unknown[]) {
  return source;
}

/**
 * AbstractTrack class.
 *
 * Core of the declarative analytics tracking components. It parses the
 * `data-track:*` attributes into {@link TrackEvent} instances, resolves the
 * context provided by ancestor {@link TrackContext} components, merges every
 * payload layer and hands the result to the {@link AbstractTrack.dispatch}
 * seam.
 *
 * Concrete implementations (`Track`, `TrackShopify`, …) override `dispatch()`
 * to send the resolved payload to their destination. They MUST declare their
 * own `static config` with a unique `name`, otherwise they inherit the
 * `AbstractTrack` name and cannot be resolved.
 *
 * @link https://ui.studiometa.dev/components/Track/
 */
export class AbstractTrack<T extends BaseProps = BaseProps> extends Base<AbstractTrackProps & T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractTrack',
    refs: ['payload'],
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
   * Get all TrackEvent instances parsed from `data-track:*` attributes.
   */
  get trackEvents(): Set<TrackEvent> {
    if (this.__trackEvents) {
      return this.__trackEvents;
    }

    this.__trackEvents = new Set();

    // Parse data-track:* attributes
    for (let i = 0; i < this.$el.attributes.length; i++) {
      const attr = this.$el.attributes[i];
      if (attr.name.startsWith('data-track:')) {
        const eventDefinition = attr.name.slice(11); // Remove 'data-track:'
        try {
          const data = attr.value ? JSON.parse(attr.value) : {};
          this.__trackEvents.add(new TrackEvent(this, eventDefinition, data ?? {}));
        } catch (err) {
          this.$warn(`Invalid JSON in ${attr.name}:`, err);
        }
      }
    }

    return this.__trackEvents;
  }

  /**
   * Get the component's own base payload from the optional `payload` ref, a
   * `<script data-ref="payload" type="application/json">` element.
   */
  get payload(): Record<string, unknown> {
    const script = this.$refs.payload;

    if (!script) {
      return {};
    }

    try {
      return JSON.parse(script.textContent || '{}') ?? {};
    } catch (err) {
      this.$warn('Invalid JSON in the `payload` ref:', err);
      return {};
    }
  }

  /**
   * Get the merged context from the closest ancestor TrackContext.
   *
   * The closest TrackContext already exposes the whole ancestor chain merged
   * through its own recursive `context` getter, so reading it here is enough.
   */
  get context(): Record<string, unknown> {
    const context = this.$closest<TrackContext>('TrackContext');
    return context?.context ?? {};
  }

  /**
   * Merge every payload layer and hand the result to the dispatch seam.
   *
   * Merge priority (lowest → highest): ancestor context chain, the
   * component's own payload, then the event's inline data.
   *
   * @param data - The event specific tracking data.
   * @param event - The optional DOM event that triggered the dispatch.
   */
  send(data: Record<string, unknown>, event?: Event): void {
    const payload = deepmerge.all([this.context, this.payload ?? {}, data ?? {}], {
      arrayMerge,
    }) as Record<string, unknown>;

    this.dispatch(payload, event);
  }

  /**
   * Dispatch seam.
   *
   * The base implementation is a no-op; concrete components override it to
   * push the resolved payload to their analytics destination.
   *
   * @param payload - The fully merged tracking payload.
   * @param event - The optional DOM event that triggered the dispatch.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch(payload: Record<string, unknown>, event?: Event): void {}

  /**
   * Mounted lifecycle hook.
   */
  mounted() {
    for (const trackEvent of this.trackEvents) {
      if (trackEvent.event === 'mounted') {
        // Resolve the context on the next frame so an ancestor TrackContext
        // mounted just after this component is still taken into account.
        nextFrame(() => this.send(trackEvent.data));
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
