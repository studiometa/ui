/**
 * The behavior of a programmatic scroll, as the reduced-motion setting allows
 * it right now.
 */

import { usePrefersReducedMotion } from '@studiometa/js-toolkit/usePrefersReducedMotion';

/**
 * How a programmatic scroll should animate.
 *
 * `smooth` is an author-implemented animation, so it is the component's to
 * suppress under `prefers-reduced-motion: reduce`: the destination is
 * unchanged, only the travel disappears.
 *
 * Read at call time from the toolkit's shared `(prefers-reduced-motion:
 * reduce)` service rather than sampled once at mount. Its `props()` reads the
 * live `MediaQueryList`, so a setting changed mid-session — every platform with
 * a "reduce motion" toggle in its quick settings — applies to the next scroll
 * without a subscription to keep.
 */
export function scrollBehavior(): ScrollBehavior {
  return usePrefersReducedMotion().props().matches ? 'instant' : 'smooth';
}
