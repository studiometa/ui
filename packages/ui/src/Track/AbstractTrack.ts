import { Base } from '@studiometa/js-toolkit/Base';
import { namespaceQualifier } from '@studiometa/js-toolkit/namespaceQualifier';
import { watchAttributeNamespace } from '@studiometa/js-toolkit/watchAttributeNamespace';
import type { BaseConfig, BaseProps, MountedReturn } from '@studiometa/js-toolkit';
import { deepmerge } from '@studiometa/js-toolkit/utils/deepmerge';
import { MOUNTED_EVENT, whenMounted } from '../utils/mounted-event.js';
import { TrackContext } from './TrackContext.js';
import { TrackEvent } from './TrackEvent.js';

/**
 * The namespace one `TrackEvent` is declared by. Its qualifiers are any DOM
 * event plus the two pseudo-events, so the set of names is open.
 */
const TRACK_NAMESPACE = 'data-track';

export type AbstractTrackProps = BaseProps & {
  $refs: {
    payload?: HTMLScriptElement;
  };
  $options: {
    threshold: number;
    payload: Record<string, unknown>;
  };
};

/**
 * Parse a `data-track:<event>` value. Empty values carry no data, JSON values
 * carry a payload, and other values define the event name.
 */
function parseEventValue(value: string): Record<string, unknown> {
  const trimmed = value.trim();

  if (!trimmed) {
    return {};
  }

  if (!trimmed.startsWith('{')) {
    return { event: trimmed };
  }

  return (JSON.parse(trimmed) as Record<string, unknown> | null) ?? {};
}

/**
 * Parses declarative tracking events, merges context and payload data, and
 * forwards each result to the concrete `dispatch()` implementation.
 */
export class AbstractTrack<T extends BaseProps = BaseProps> extends Base<AbstractTrackProps & T> {
  static config: BaseConfig = {
    name: 'AbstractTrack',
    refs: ['payload'],
    options: {
      threshold: {
        type: Number,
        default: 0,
      },
      payload: {
        type: Object,
        // Each instance requires its own mutable default object.
        default: () => ({}),
      },
    },
  };

  /** Every current `data-track:*` declaration on the element. */
  get trackEvents(): TrackEvent[] {
    const trackEvents: TrackEvent[] = [];

    for (const { name, value } of Array.from(this.$el.attributes)) {
      const trackEvent = this.__parseAttribute(name, value);
      if (trackEvent) {
        trackEvents.push(trackEvent);
      }
    }

    return trackEvents;
  }

  /**
   * The base payload from the optional `payload` ref, a
   * `<script data-ref="payload" type="application/json">` element.
   */
  get scriptPayload(): Record<string, unknown> {
    const script = this.$refs.payload;

    if (!script) {
      return {};
    }

    try {
      return (JSON.parse(script.textContent || '{}') as Record<string, unknown> | null) ?? {};
    } catch (error) {
      this.$error('track.invalid-json', 'Invalid JSON in the `payload` ref.', error);
      return {};
    }
  }

  /**
   * The base payload from the optional `data-option-payload` attribute.
   */
  get optionPayload(): Record<string, unknown> {
    try {
      return this.$options.payload ?? {};
    } catch (error) {
      this.$error('track.invalid-json', 'Invalid JSON in the `payload` option.', error);
      return {};
    }
  }

  /**
   * The component's own payload, shared by every event on the element. The
   * option overrides the ref, mirroring `TrackContext`.
   *
   * Read per dispatch and never cached: both sources are DOM-backed, and a
   * partial update can rewrite the script or the attribute under a component
   * that stays mounted, which a mount-cycle cache would keep publishing past.
   */
  get payload(): Record<string, unknown> {
    return deepmerge(this.scriptPayload, this.optionPayload);
  }

  /** The merged context of the ancestor chain, resolved per dispatch. */
  get context(): Record<string, unknown> {
    return this.$closest<TrackContext>('TrackContext')?.context ?? {};
  }

  /**
   * Merge every layer and hand the result to the dispatch seam.
   *
   * Lowest to highest: the ancestor context chain, this component's payload,
   * then the event's own data.
   */
  send(data: Record<string, unknown>, event?: Event): void {
    this.dispatch(deepmerge(this.context, this.payload ?? {}, data ?? {}), event);
  }

  /**
   * The dispatch seam. A no-op here; concrete components override it.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dispatch(payload: Record<string, unknown>, event?: Event): void {}

  mounted(): MountedReturn {
    const stopWatchingNamespace = watchAttributeNamespace(
      this.$el,
      TRACK_NAMESPACE,
      ({ value, attribute }) => this.__bind(attribute, value),
    );

    return stopWatchingNamespace;
  }

  /** One `data-track:<event>` attribute, or `null` for anything else. */
  /** @private */
  __parseAttribute(name: string, value: string | null): TrackEvent | null {
    const qualifier = namespaceQualifier(TRACK_NAMESPACE, name);
    if (qualifier === null || value === null) {
      return null;
    }

    try {
      return new TrackEvent(this, qualifier, parseEventValue(value));
    } catch (error) {
      this.$error('track.invalid-json', `Invalid JSON in ${name}.`, error);
      return null;
    }
  }

  /** Attach one declaration and return its release, or nothing if it is malformed. */
  /** @private */
  __bind(attribute: string, value: string): (() => void) | undefined {
    const trackEvent = this.__parseAttribute(attribute, value);

    if (!trackEvent) {
      return undefined;
    }

    const release = trackEvent.attach();

    if (trackEvent.event !== MOUNTED_EVENT) {
      return release;
    }

    const cancel = whenMounted(this, () => trackEvent.trigger());

    return () => {
      cancel();
      release();
    };
  }
}
