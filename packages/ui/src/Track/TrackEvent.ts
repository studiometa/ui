import { useInView } from '@studiometa/js-toolkit/useInView';
import type { Unsubscribe } from '@studiometa/js-toolkit';
import { throttle } from '@studiometa/js-toolkit/utils/throttle';
import { MODIFIERS, parseEventDefinition, type Modifier } from '../utils/event-modifiers.js';
import { MOUNTED_EVENT } from '../utils/mounted-event.js';
import type { AbstractTrack } from './AbstractTrack.js';

/** What a bare `debounce` means here. `Action` reads the same modifier at 100. */
const DEFAULT_DEBOUNCE_DELAY = 300;

/** What a bare `throttle` means: about one frame. */
const DEFAULT_THROTTLE_DELAY = 16;

/** Synthetic event names that do not map to DOM events. */
export const TRACK_PSEUDO_EVENTS = {
  /** Fires once the component and its context have settled. */
  MOUNTED: MOUNTED_EVENT,
  /** Fires when the element enters the viewport. */
  VIEW: 'view',
} as const;

export type TrackPseudoEvent = (typeof TRACK_PSEUDO_EVENTS)[keyof typeof TRACK_PSEUDO_EVENTS];

/** The placeholder root resolving against the whole event. */
const EVENT_PREFIX = '$event.';

/** The placeholder root resolving against `event.detail`. */
const DETAIL_PREFIX = '$detail.';

/**
 * Walk a dotted path from a root value.
 *
 * Every segment is read as a key, so a numeric one reaches an array element:
 * `request.searchParams.genre.0`. Descending into anything that is not an
 * object — a primitive, `undefined`, a root that is not there — yields
 * `undefined`, which is what a path naming data the event does not carry
 * should resolve to.
 */
function resolvePath(root: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, root);
}

/**
 * Resolve the placeholders of one value, descending into both objects and
 * arrays so nested payload placeholders are resolved too.
 *
 * `$detail.x` is rewritten to the path `detail.x` walked from the event rather
 * than resolved by a second code path, so the two roots can never disagree.
 */
function resolveValue(value: unknown, event?: Event): unknown {
  if (typeof value === 'string') {
    if (value.startsWith(EVENT_PREFIX)) {
      return resolvePath(event, value.slice(EVENT_PREFIX.length));
    }

    if (value.startsWith(DETAIL_PREFIX)) {
      return resolvePath(event, `detail.${value.slice(DETAIL_PREFIX.length)}`);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, event));
  }

  if (value && typeof value === 'object') {
    return resolveEventPlaceholders(value as Record<string, unknown>, event);
  }

  return value;
}

/**
 * Resolve every `$event.*` and `$detail.*` placeholder of a declared payload
 * against the event that triggered it.
 *
 * The resolver knows nothing about who emitted the event: it walks paths, and
 * an emitter that carries plain data is what makes a path reachable. With no
 * event, every placeholder resolves to `undefined`.
 */
export function resolveEventPlaceholders(
  data: Record<string, unknown>,
  event?: Event,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    result[key] = resolveValue(value, event);
  }

  return result;
}

/** One bound `data-track:<event>` declaration. */
export class TrackEvent {
  track: AbstractTrack;
  event: string;
  modifiers: ReadonlySet<Modifier>;
  data: Record<string, unknown>;
  debounceDelay: number;
  throttleDelay: number;

  /** The handler with its timing modifiers applied. */
  __handler: (event?: Event) => void;

  /** Cleared by the release, checked before every dispatch. */
  __isAttached = false;

  __debounceTimer?: ReturnType<typeof setTimeout>;

  constructor(track: AbstractTrack, eventDefinition: string, data: Record<string, unknown>) {
    this.track = track;
    this.data = data;

    const { event, modifiers, delay } = parseEventDefinition(eventDefinition);
    this.event = event;
    this.modifiers = modifiers;
    this.debounceDelay = delay(MODIFIERS.DEBOUNCE) ?? DEFAULT_DEBOUNCE_DELAY;
    this.throttleDelay = delay(MODIFIERS.THROTTLE) ?? DEFAULT_THROTTLE_DELAY;

    // Own the debounce timer so release can cancel it.
    const dispatch = (domEvent?: Event) => this.handleEvent(domEvent);

    if (modifiers.has(MODIFIERS.DEBOUNCE)) {
      this.__handler = (domEvent?: Event) => {
        clearTimeout(this.__debounceTimer);
        this.__debounceTimer = setTimeout(() => dispatch(domEvent), this.debounceDelay);
      };
    } else if (modifiers.has(MODIFIERS.THROTTLE)) {
      this.__handler = throttle(dispatch, this.throttleDelay);
    } else {
      this.__handler = dispatch;
    }
  }

  /**
   * Resolve the payload for this event and hand it to the component.
   */
  handleEvent(event?: Event): void {
    const { modifiers, data, track } = this;

    // Ignore work queued before the binding was released.
    if (!this.__isAttached) {
      return;
    }

    if (event && modifiers.has(MODIFIERS.PREVENT)) {
      event.preventDefault();
    }

    if (event && modifiers.has(MODIFIERS.STOP)) {
      event.stopPropagation();
    }

    // Merging a detail wholesale stays a `CustomEvent` affair — a native event
    // has none — while paths resolve against whatever event arrived, including
    // none at all for the `mounted` pseudo-event.
    let finalData: Record<string, unknown>;
    if (modifiers.has(MODIFIERS.DETAIL)) {
      const detail = event instanceof CustomEvent ? (event.detail as unknown) : undefined;
      finalData =
        detail && typeof detail === 'object'
          ? { ...data, ...(detail as Record<string, unknown>) }
          : data;
    } else {
      finalData = resolveEventPlaceholders(data, event);
    }

    track.send(finalData, event);
  }

  /**
   * Trigger the handler with no DOM event, for the synthetic `mounted` event,
   * so the timing modifiers and the attached guard apply to it too.
   */
  trigger(): void {
    this.__handler();
  }

  /** Bind this declaration and return its release. */
  attach(): Unsubscribe {
    this.__isAttached = true;
    const release = this.__bind();

    return () => {
      this.__isAttached = false;
      clearTimeout(this.__debounceTimer);
      release();
    };
  }

  /** @private */
  __bind(): Unsubscribe {
    const { event, modifiers, track } = this;

    if (event === MOUNTED_EVENT) {
      // Nothing to bind: `AbstractTrack` triggers it once the DOM has settled.
      return () => {};
    }

    if (event === TRACK_PSEUDO_EVENTS.VIEW) {
      let unsubscribe: Unsubscribe | undefined;
      unsubscribe = useInView(track.$el, { threshold: track.$options.threshold }).subscribe(
        ({ isInView }) => {
          if (!isInView) {
            return;
          }
          // `isInView` and not `ratio >= threshold`: the observer's own
          // threshold already controls sensitivity, and comparing ratios would
          // make an impression unreachable for an element taller than the
          // viewport, whose ratio can never approach a non-zero threshold.
          this.__handler();
          if (modifiers.has(MODIFIERS.ONCE)) {
            // Hoisted because the callback can run during `subscribe()`.
            unsubscribe?.();
            unsubscribe = undefined;
          }
        },
      );
      return () => unsubscribe?.();
    }

    return track.$on(event, this.__handler, {
      capture: modifiers.has(MODIFIERS.CAPTURE),
      once: modifiers.has(MODIFIERS.ONCE),
      passive: modifiers.has(MODIFIERS.PASSIVE),
    });
  }
}
