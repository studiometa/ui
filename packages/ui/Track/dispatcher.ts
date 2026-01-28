declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type TrackDispatcher = (data: Record<string, unknown>, event?: Event) => void;

let dispatcher: TrackDispatcher | null = null;

/**
 * Default dispatcher: push to dataLayer (GTM).
 * GTM handles consent at tag level via Axeptio/CMP triggers.
 */
function defaultDispatcher(data: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
}

/**
 * Set a custom dispatcher function.
 *
 * @param fn - The dispatcher function, or null to reset to default.
 *
 * @example
 * ```js
 * import { setTrackDispatcher } from '@studiometa/ui';
 *
 * // Send to GA4 directly
 * setTrackDispatcher((data, event) => {
 *   gtag('event', data.event, data);
 * });
 *
 * // Send to multiple destinations
 * setTrackDispatcher((data) => {
 *   window.dataLayer.push(data);
 *   fetch('/api/analytics', { method: 'POST', body: JSON.stringify(data) });
 * });
 *
 * // Reset to default (dataLayer.push)
 * setTrackDispatcher(null);
 * ```
 */
export function setTrackDispatcher(fn: TrackDispatcher | null): void {
  dispatcher = fn;
}

/**
 * Get the current dispatcher function.
 * @internal
 */
export function getTrackDispatcher(): TrackDispatcher {
  return dispatcher ?? defaultDispatcher;
}
