import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'vitest';
import { getInstances } from '@studiometa/js-toolkit';

GlobalRegistrator.register();

window.__DEV__ = true;

let y = 0;
let x = 0;

// Track pending `requestAnimationFrame` callbacks (mocked with `setTimeout`) so
// they can be cancelled — happy-dom does not provide `cancelAnimationFrame`,
// and js-toolkit's RAF loop and the transition helper reschedule themselves
// every frame. Without cancellation a leftover frame fires after the test
// file's environment is torn down (`ReferenceError: Node is not defined`, …),
// surfacing as cross-file unhandled errors.
const pendingRafs = new Map<number, ReturnType<typeof setTimeout>>();
let rafId = 0;

Object.defineProperties(window, {
  scrollY: {
    get: () => {
      return y;
    },
    set: (value) => {
      y = Number(value);
    },
  },
  scrollX: {
    get: () => {
      return x;
    },
    set: (value) => {
      x = Number(value);
    },
  },
  requestAnimationFrame: {
    value(callback: FrameRequestCallback) {
      const id = ++rafId;
      const timer = setTimeout(() => {
        pendingRafs.delete(id);
        callback(performance.now());
      }, 16);
      pendingRafs.set(id, timer);
      return id;
    },
  },
  cancelAnimationFrame: {
    value(id: number) {
      const timer = pendingRafs.get(id);
      if (timer) {
        clearTimeout(timer);
        pendingRafs.delete(id);
      }
    },
  },
});

// Cancel every pending animation frame, breaking any self-rescheduling loop.
function clearPendingRafs() {
  for (const timer of pendingRafs.values()) {
    clearTimeout(timer);
  }
  pendingRafs.clear();
}

// Clean up after every test: destroy any component a test left mounted (which
// stops its services — the RAF loop, pointer/resize listeners…) and cancel any
// frame still pending (e.g. an in-flight transition). This keeps a test's
// asynchronous work from leaking into the next test file and firing against a
// torn-down environment.
afterEach(async () => {
  const mounted = [...getInstances()].filter((instance) => instance.$isMounted);
  await Promise.allSettled(mounted.map((instance) => instance.$destroy()));
  clearPendingRafs();
});
