/**
 * The reserved `mounted` pseudo-event, and the scheduling both families that
 * declare it share.
 *
 * `Action` and `Track` both let HTML react to their own mount. A component
 * lifecycle DOM event cannot express that: it bubbles, so a descendant
 * mounting later fires the declaration again, and it arrives while the batch
 * is still running, so a component sharing the element may not be resolvable
 * yet. `mounted` is therefore a name the families reserve rather than an event
 * they listen to — nothing is bound, and the work is posted to the background
 * lane instead, which runs once the batch has settled.
 */

import { defaultScheduler } from '@studiometa/js-toolkit/defaultScheduler';
import type { Base, Unsubscribe } from '@studiometa/js-toolkit';

/** The event name both families reserve. It binds no DOM listener. */
export const MOUNTED_EVENT = 'mounted';

/**
 * Run `callback` once the mount batch has settled, and return its cancel.
 *
 * The cancel belongs to the binding that asked for the work rather than to the
 * mount, so a declaration rewritten before the task runs cancels its own
 * pending call. Releasing every binding is what ends a mount cycle, so an
 * unmount cancels through the same path; `$isMounted` is checked as well,
 * because the component can also be unmounted by the time the lane drains.
 *
 * @param component The component whose mount cycle the work belongs to.
 * @param callback  The work to run once the batch has settled.
 * @returns A cancel for the pending work, safe to call after it has run.
 */
export function whenMounted(component: Base, callback: () => void): Unsubscribe {
  const task = defaultScheduler.background(() => {
    if (component.$isMounted) {
      callback();
    }
  });

  return () => task.cancel();
}
