type ViewTransitionUpdate = () => void | Promise<void>;

interface QueueItem {
  update: ViewTransitionUpdate;
  resolve: () => void;
  reject: (reason?: unknown) => void;
}

/**
 * Pending updates for the next batch.
 * @private
 */
let __queue: QueueItem[] = [];

/**
 * Whether a flush has already been scheduled for the current microtask.
 * @private
 */
let __scheduled = false;

/**
 * The currently running transition, used to serialize batches.
 * @private
 */
let __running: Promise<void> | null = null;

/**
 * Whether the native View Transitions API is available.
 * @private
 */
function __isSupported(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

/**
 * Flush every queued update in a single view transition.
 * @private
 */
async function __flush() {
  const batch = __queue;
  __queue = [];
  __scheduled = false;

  // Serialize behind any in-flight transition so rapid enter/leave calls play
  // out one after the other instead of clobbering each other.
  if (__running) {
    await __running;
  }

  async function runAll() {
    for (const { update } of batch) {
      // eslint-disable-next-line no-await-in-loop
      await update();
    }
  }

  if (!__isSupported()) {
    try {
      await runAll();
      for (const { resolve } of batch) resolve();
    } catch (error) {
      for (const { reject } of batch) reject(error);
    }
    return;
  }

  const transition = document.startViewTransition(runAll);
  __running = transition.finished.then(
    () => {},
    () => {},
  );

  try {
    await transition.finished;
    for (const { resolve } of batch) resolve();
  } catch (error) {
    for (const { reject } of batch) reject(error);
  } finally {
    __running = null;
  }
}

/**
 * Run a DOM update inside a batched, native View Transition.
 *
 * Every update requested within the same microtask is flushed together in a
 * single `document.startViewTransition()` call, so independent elements — a
 * backdrop and a sliding panel, for example — animate as one coordinated
 * transition. Give each element a unique `view-transition-name` to have it
 * animate on its own. Batches are serialized across ticks.
 *
 * When the API is unavailable (or there is no `document`), the update runs
 * synchronously without animation, so it is safe as progressive enhancement.
 *
 * @param   update The DOM mutation to run inside the view transition.
 * @returns A promise resolved once the transition has finished.
 * @link https://ui.studiometa.dev/components/ViewTransition/
 */
export function viewTransition(update: ViewTransitionUpdate): Promise<void> {
  return new Promise((resolve, reject) => {
    __queue.push({ update, resolve, reject });

    if (!__scheduled) {
      __scheduled = true;
      queueMicrotask(__flush);
    }
  });
}
