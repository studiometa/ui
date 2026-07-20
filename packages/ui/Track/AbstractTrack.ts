import deepmerge from 'deepmerge';
import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { memo, nextFrame } from '@studiometa/js-toolkit/utils';
import { TrackContext } from './TrackContext.js';
import { TrackEvent } from './TrackEvent.js';
import { arrayMerge } from './utils.js';

export interface AbstractTrackProps extends BaseProps {
  $refs: {
    payload?: HTMLScriptElement;
  };
  $options: {
    threshold: number;
    payload: Record<string, unknown>;
  };
}

/**
 * Parse the value of a `data-track:<event>` attribute.
 *
 * - An empty value carries no data (the payload comes from the context, the
 *   `payload` ref and/or the `payload` option).
 * - A value starting with `{` is parsed as a JSON payload (escape hatch for
 *   per-event structured data). May throw on malformed JSON.
 * - Any other value is a bare token used as the event name, so
 *   `data-track:click="add_to_cart"` is shorthand for `{ "event": "add_to_cart" }`.
 */
function parseEventValue(value: string): Record<string, unknown> {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  if (!trimmed.startsWith('{')) {
    return { event: trimmed };
  }

  return JSON.parse(trimmed) ?? {};
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
        default: 0,
      },
      payload: Object,
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
          const data = parseEventValue(attr.value);
          this.__trackEvents.add(new TrackEvent(this, eventDefinition, data));
        } catch (err) {
          this.$warn(`Invalid JSON in ${attr.name}:`, err);
        }
      }
    }

    return this.__trackEvents;
  }

  /**
   * Get the component's base payload from the optional `payload` ref, a
   * `<script data-ref="payload" type="application/json">` element.
   */
  get scriptPayload(): Record<string, unknown> {
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
   * Get the component's base payload from the optional `data-option-payload`
   * attribute.
   */
  get optionPayload(): Record<string, unknown> {
    try {
      // OptionsManager parses Object options with `JSON.parse`, which throws
      // uncaught on malformed values; guard it here.
      return this.$options.payload ?? {};
    } catch (err) {
      this.$warn('Invalid JSON in the `payload` option:', err);
      return {};
    }
  }

  /**
   * Resolve the component's base payload once per instance.
   *
   * Sourced from both the `payload` ref and the `payload` option (the option
   * overrides the ref, mirroring `TrackContext`). Memoized so a high-frequency
   * event (e.g. `scroll.throttle16`) does not re-parse the `<script>` payload
   * on every dispatch.
   * @private
   */
  __resolvePayload = memo(() => deepmerge(this.scriptPayload, this.optionPayload, { arrayMerge }));

  /**
   * Resolve the merged ancestor context once per instance.
   *
   * The closest TrackContext already exposes the whole ancestor chain merged
   * through its own recursive `context` getter, so reading it here is enough.
   * Memoized to avoid re-walking the ancestor chain on every dispatch.
   * @private
   */
  __resolveContext = memo(() => this.$closest<TrackContext>('TrackContext')?.context ?? {});

  /**
   * Get the component's base payload, shared by every event on the element.
   */
  get payload(): Record<string, unknown> {
    return this.__resolvePayload();
  }

  /**
   * Get the merged context from the closest ancestor TrackContext.
   */
  get context(): Record<string, unknown> {
    return this.__resolveContext();
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
        // mounted just after this component is still taken into account. Guard
        // against a same-frame destroy (e.g. an SPA route change) so we never
        // dispatch for an unmounted component. Route through the TrackEvent
        // handler so timing modifiers apply consistently with other events.
        nextFrame(() => {
          if (this.$isMounted) {
            trackEvent.trigger();
          }
        });
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
