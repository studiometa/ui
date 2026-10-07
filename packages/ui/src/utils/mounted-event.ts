/**
 * The reserved `mounted` pseudo-event, and the scheduling both families that
 * declare it share.
 *
 * `Action` and `Track` both let HTML react to their own mount. A component
 * lifecycle DOM event cannot express that: it bubbles, so a descendant
 * mounting later fires the declaration again, and it arrives while the batch
 * is still running, so a component sharing the element may not be resolvable
 * yet. `mounted` is therefore a name the families reserve rather than an event
 * they listen to: nothing is bound, and the work waits for the DOM to settle.
 */

import { defaultScheduler } from '@studiometa/js-toolkit/defaultScheduler';
import { whenDOMSettled } from '@studiometa/js-toolkit/whenDOMSettled';
import type { Base, ScheduledTask, Unsubscribe } from '@studiometa/js-toolkit';

/** The event name both families reserve. It binds no DOM listener. */
export const MOUNTED_EVENT = 'mounted';

/**
 * Run `callback` once the DOM has settled, and return its cancel.
 *
 * "Settled" is `whenDOMSettled()`: every pending mutation is processed and
 * every eager import and mount has finished. That is what lets the callback
 * reach a component imported lazily through a manifest, on the same element
 * or anywhere else. A component waiting for a `visible`, `in-view`, `idle`,
 * `interaction` or `media:` strategy is not awaited: it may never mount.
 *
 * The callback then runs as a background task rather than in the promise
 * continuation, so an error it throws is reported on the diagnostic channel
 * like any other scheduled task instead of being lost in a rejected promise.
 *
 * The cancel belongs to the binding that asked for the work rather than to the
 * mount, so a declaration rewritten before the work runs cancels its own call.
 * Releasing every binding is what ends a mount cycle, so an unmount cancels
 * through the same path. `$isMounted` is checked as well, because the
 * component can also be unmounted by the time the task runs.
 *
 * @param component The component whose mount cycle the work belongs to.
 * @param callback  The work to run once the DOM has settled.
 * @returns A cancel for the pending work, safe to call after it has run.
 */
export function whenMounted(component: Base, callback: () => void): Unsubscribe {
  let isCancelled = false;
  let task: ScheduledTask<unknown> | undefined;

  function schedule(): void {
    if (isCancelled) {
      return;
    }

    task = defaultScheduler.background(() => {
      if (component.$isMounted) {
        callback();
      }
    });
  }

  // Scheduled on rejection too: a failure while settling must not silently
  // drop a declaration the author wrote.
  void whenDOMSettled().then(schedule, schedule);

  return () => {
    isCancelled = true;
    task?.cancel();
  };
}
