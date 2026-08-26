import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'vitest';
import { resetDom } from '@studiometa/js-toolkit/test';

GlobalRegistrator.register();

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

// Clean up after every test: empty the document, which lets the shared mutation
// observer dispose every controller it built (and with them the RAF loop, the
// pointer and resize listeners…), then cancel any frame still pending — an
// in-flight transition, for instance. This keeps a test's asynchronous work
// from leaking into the next test file and firing against a torn-down
// environment.
//
// v3's page-wide `getInstances()` is gone in v4: instances live on their
// element and nothing collects them, so `resetDom()` from
// `@studiometa/js-toolkit/test` is the supported way to reach them all.
afterEach(async () => {
  await resetDom();
  clearPendingRafs();
});
