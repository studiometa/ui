import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach } from 'vitest';
import { resetDom } from '@studiometa/js-toolkit/test';

GlobalRegistrator.register();

// `reportError()` is a platform global every browser ships and neither Node nor
// happy-dom provides. js-toolkit's diagnostic channel calls it as its default
// error sink, so `$error()` — which several ported families use to report a
// failure they recovered from — throws a `ReferenceError` here instead of
// reporting anything, and the rejection then poisons the rest of the file.
// Route it to `console.error`, which is what the platform's own default does.
if (typeof globalThis.reportError !== 'function') {
  (globalThis as Record<string, unknown>).reportError = (error: unknown) => {
    console.error(error);
  };
}

// `window instanceof Window` is true in every browser. `@happy-dom/global-
// registrator` copies the window's properties onto Node's `globalThis` instead
// of replacing it, so the global `window` is a plain object and the check is
// false here. js-toolkit's scroll service branches on exactly that check to
// tell a window target from an element one, so `useScroll()`/`useWindowScroll()`
// otherwise read `window.scrollLeft` and iterate `window.children` — and throw.
// Restore the invariant on the check itself rather than on the object, which
// would mean re-parenting Node's global.
Object.defineProperty(Window, Symbol.hasInstance, {
  value: (value: unknown) =>
    value === globalThis || Object.prototype.isPrototypeOf.call(Window.prototype, value),
});

// WebIDL makes every interface with an indexed property getter iterable, so
// `[...element.children]` and `for (const child of element.children)` work in
// every browser. happy-dom's `HTMLCollection` has no `Symbol.iterator`, which
// makes js-toolkit's scroll service throw `scroller.children is not iterable`
// the moment anything subscribes to `useScroll()` or `useWindowScroll()`.
if (typeof HTMLCollection.prototype[Symbol.iterator] !== 'function') {
  HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
}

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
