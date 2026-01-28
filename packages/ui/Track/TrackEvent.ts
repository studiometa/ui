import { debounce, throttle } from '@studiometa/js-toolkit/utils';
import type { Track } from './Track.js';

export type Modifier = 'prevent' | 'stop' | 'once' | 'passive' | 'capture' | 'debounce' | 'throttle';

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
    if (typeof value === 'string' && value.startsWith('$detail.')) {
      const path = value.slice(8); // Remove '$detail.'
      result[key] = getNestedValue(detail, path);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = resolveDetailPlaceholders(value as Record<string, unknown>, detail);
    } else {
      result[key] = value;
    }
  }

  return result;
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
  track: Track;
  event: string;
  modifiers: Modifier[];
  data: Record<string, unknown>;
  debounceDelay: number;
  throttleDelay: number;

  private handler: EventListener;
  private observer?: IntersectionObserver;

  constructor(track: Track, eventDefinition: string, data: Record<string, unknown>) {
    this.track = track;
    this.data = data;

    const { event, modifiers, debounceDelay, throttleDelay } = parseEventDefinition(eventDefinition);
    this.event = event;
    this.modifiers = modifiers;
    this.debounceDelay = debounceDelay;
    this.throttleDelay = throttleDelay;

    // Build handler with timing modifiers
    let handler: EventListener = (event: Event) => this.handleEvent(event);

    if (modifiers.includes('debounce')) {
      handler = debounce(handler, debounceDelay) as EventListener;
    } else if (modifiers.includes('throttle')) {
      handler = throttle(handler, throttleDelay) as EventListener;
    }

    this.handler = handler;
  }

  /**
   * Handle the DOM event and dispatch tracking data.
   */
  handleEvent(event: Event) {
    const { modifiers, data, track } = this;

    if (modifiers.includes('prevent')) {
      event.preventDefault();
    }

    if (modifiers.includes('stop')) {
      event.stopPropagation();
    }

    // Handle CustomEvent detail merging
    let finalData = data;
    if (event instanceof CustomEvent && event.detail) {
      // Check for .detail modifier (merge full detail)
      if (modifiers.includes('detail' as Modifier)) {
        finalData = { ...data, ...event.detail };
      } else {
        // Resolve $detail.* placeholders
        finalData = resolveDetailPlaceholders(data, event.detail);
      }
    }

    track.dispatch(finalData, event);
  }

  /**
   * Attach the event listener for standard DOM events.
   */
  attachEvent() {
    const { event, modifiers, handler, track } = this;

    track.$el.addEventListener(event, handler, {
      capture: modifiers.includes('capture'),
      once: modifiers.includes('once'),
      passive: modifiers.includes('passive'),
    });
  }

  /**
   * Attach IntersectionObserver for the "view" event.
   */
  attachViewEvent() {
    const { modifiers, track, data } = this;
    const threshold = track.$options.threshold;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            track.dispatch(data);

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
    this.track.$el.removeEventListener(this.event, this.handler);
    this.observer?.disconnect();
  }
}
