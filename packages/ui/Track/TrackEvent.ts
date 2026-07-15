import { throttle } from '@studiometa/js-toolkit/utils';
import type { AbstractTrack } from './AbstractTrack.js';

export type Modifier =
  | 'prevent'
  | 'stop'
  | 'once'
  | 'passive'
  | 'capture'
  | 'debounce'
  | 'throttle'
  | 'detail';

export interface ParsedEvent {
  event: string;
  modifiers: Modifier[];
  debounceDelay: number;
  throttleDelay: number;
}

/**
 * Parse an event definition string into its components.
 *
 * @link https://ui.studiometa.dev/components/Track/js-api.html#event-modifiers
 *
 * @param eventDefinition - Event string like "click.prevent.stop" or "input.debounce300"
 * @returns Parsed event with modifiers and timing delays
 *
 * @example
 * ```ts
 * parseEventDefinition('click.prevent.stop');
 * // { event: 'click', modifiers: ['prevent', 'stop'], debounceDelay: 0, throttleDelay: 0 }
 *
 * parseEventDefinition('input.debounce500');
 * // { event: 'input', modifiers: ['debounce'], debounceDelay: 500, throttleDelay: 0 }
 * ```
 */
export function parseEventDefinition(eventDefinition: string): ParsedEvent {
  const [event, ...rawModifiers] = eventDefinition.split('.');

  let debounceDelay = 0;
  let throttleDelay = 0;
  const modifiers: Modifier[] = [];

  for (const mod of rawModifiers) {
    if (mod.startsWith('debounce')) {
      modifiers.push('debounce');
      debounceDelay = parseInt(mod.replace('debounce', '') || '300', 10);
    } else if (mod.startsWith('throttle')) {
      modifiers.push('throttle');
      throttleDelay = parseInt(mod.replace('throttle', '') || '16', 10);
    } else {
      modifiers.push(mod as Modifier);
    }
  }

  return { event, modifiers, debounceDelay, throttleDelay };
}

/**
 * Resolve `$detail.*` placeholders in tracking data with values from event.detail.
 *
 * @link https://ui.studiometa.dev/components/Track/js-api.html#custom-events
 *
 * @param data - The tracking data object
 * @param detail - The event.detail object from a CustomEvent
 * @returns New object with placeholders resolved
 *
 * @example
 * ```ts
 * resolveDetailPlaceholders(
 *   { event: 'form_submit', email: '$detail.email', name: '$detail.user.name' },
 *   { email: 'test@example.com', user: { name: 'John' } }
 * );
 * // { event: 'form_submit', email: 'test@example.com', name: 'John' }
 * ```
 */
export function resolveDetailPlaceholders(
  data: Record<string, unknown>,
  detail: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    result[key] = resolveDetailValue(value, detail);
  }

  return result;
}

/**
 * Resolve `$detail.*` placeholders in an arbitrary value, descending into both
 * objects and arrays so placeholders nested inside arrays (e.g. GA4
 * `ecommerce.items`) are resolved too.
 */
function resolveDetailValue(value: unknown, detail: Record<string, unknown>): unknown {
  if (typeof value === 'string' && value.startsWith('$detail.')) {
    return getNestedValue(detail, value.slice(8)); // Remove '$detail.'
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveDetailValue(item, detail));
  }

  if (value && typeof value === 'object') {
    return resolveDetailPlaceholders(value as Record<string, unknown>, detail);
  }

  return value;
}

/**
 * Get a nested value from an object using a dot-separated path.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * TrackEvent handles DOM event binding for the Track component.
 *
 * @link https://ui.studiometa.dev/components/Track/js-api.html#events
 */
export class TrackEvent {
  track: AbstractTrack;
  event: string;
  modifiers: Modifier[];
  data: Record<string, unknown>;
  debounceDelay: number;
  throttleDelay: number;

  private handler: (event?: Event) => void;
  private observer?: IntersectionObserver;
  private detached = false;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor(track: AbstractTrack, eventDefinition: string, data: Record<string, unknown>) {
    this.track = track;
    this.data = data;

    const { event, modifiers, debounceDelay, throttleDelay } =
      parseEventDefinition(eventDefinition);
    this.event = event;
    this.modifiers = modifiers;
    this.debounceDelay = debounceDelay;
    this.throttleDelay = throttleDelay;

    // Build the handler with timing modifiers. The debounce timer is owned by
    // the instance (rather than js-toolkit's non-cancelable `debounce`) so it
    // can be cleared on detach; otherwise a pending debounced dispatch could
    // fire in a later lifecycle after a destroy/remount, once the `detached`
    // guard has been reset. `throttle` schedules no deferred callback, so it
    // needs no cancellation.
    const dispatch = (event?: Event) => this.handleEvent(event);

    if (modifiers.includes('debounce')) {
      this.handler = (event?: Event) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => dispatch(event), debounceDelay);
      };
    } else if (modifiers.includes('throttle')) {
      this.handler = throttle(dispatch, throttleDelay) as (event?: Event) => void;
    } else {
      this.handler = dispatch;
    }
  }

  /**
   * Handle the DOM event and dispatch tracking data.
   */
  handleEvent(event?: Event) {
    const { modifiers, data, track } = this;

    // A debounced/throttled handler — or a queued IntersectionObserver
    // notification — can still fire after the component is destroyed; bail out
    // so we never dispatch from a detached instance.
    if (this.detached) {
      return;
    }

    if (event && modifiers.includes('prevent')) {
      event.preventDefault();
    }

    if (event && modifiers.includes('stop')) {
      event.stopPropagation();
    }

    // Handle CustomEvent detail merging. A non-object detail (0, false, '', …)
    // is treated as an empty detail so placeholders resolve to `undefined`
    // instead of leaking the literal `$detail.*` string.
    let finalData = data;
    if (event instanceof CustomEvent) {
      const detail =
        event.detail && typeof event.detail === 'object'
          ? (event.detail as Record<string, unknown>)
          : {};

      if (modifiers.includes('detail')) {
        finalData = { ...data, ...detail };
      } else {
        finalData = resolveDetailPlaceholders(data, detail);
      }
    }

    track.send(finalData, event);
  }

  /**
   * Trigger the handler manually, e.g. for the synthetic `mounted` event, so
   * timing modifiers and the detached guard apply consistently.
   */
  trigger() {
    this.handler();
  }

  /**
   * Attach the event listener for standard DOM events.
   */
  attachEvent() {
    const { event, modifiers, handler, track } = this;
    this.detached = false; // re-attaching after a destroy/remount cycle

    track.$el.addEventListener(event, handler as EventListener, {
      capture: modifiers.includes('capture'),
      once: modifiers.includes('once'),
      passive: modifiers.includes('passive'),
    });
  }

  /**
   * Attach IntersectionObserver for the "view" event.
   */
  attachViewEvent() {
    const { modifiers, track, handler } = this;
    this.detached = false; // re-attaching after a destroy/remount cycle
    const threshold = track.$options.threshold;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Rely on `isIntersecting` (the observer's own `threshold` controls
          // sensitivity). Comparing `intersectionRatio >= threshold` would make
          // impressions unreachable for elements taller than the viewport,
          // whose ratio can never approach a non-zero threshold.
          if (entry.isIntersecting) {
            // Dispatch through the shared handler so timing modifiers and the
            // detached guard apply to the `view` event too.
            handler();

            if (modifiers.includes('once')) {
              this.observer?.disconnect();
            }
          }
        }
      },
      { threshold },
    );

    this.observer.observe(track.$el);
  }

  /**
   * Detach the event listener.
   */
  detachEvent() {
    this.detached = true;
    // Cancel any pending debounced dispatch so it cannot fire in a later
    // lifecycle after a remount.
    clearTimeout(this.debounceTimer);
    // The `capture` flag must match the one used at registration for the
    // listener to actually be removed.
    this.track.$el.removeEventListener(this.event, this.handler as EventListener, {
      capture: this.modifiers.includes('capture'),
    });
    this.observer?.disconnect();
  }
}
