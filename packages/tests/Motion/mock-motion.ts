import { vi } from 'vitest';
// The value readers are pure DOM readers, not animation drivers: the double
// uses the real ones so the captured base values follow Motion's semantics.
import { transformProps, readTransformValue, getComputedStyle } from 'motion';
import { provideMotion, type MotionModule } from '@studiometa/ui-motion';

/**
 * Minimal stand-in for the playback controls `motion`'s `animate()` returns:
 * happy-dom has no Web Animations API, so the specs drive completion by hand
 * through {@link MockAnimation.finish}.
 */
export class MockAnimation {
  element: Element | null;
  /** The segments array when built from `animate(sequence, options)`. */
  sequence: unknown[] | null;
  keyframes: Record<string, unknown>;
  options: Record<string, unknown> | undefined;
  speed = 1;
  time = 0;
  duration = 2;
  state: 'running' | 'paused' | 'stopped' | 'cancelled' | 'finished' = 'running';
  playCount = 0;

  /**
   * `null` while pending, `0` once resolved (finished), `1` once rejected
   * (stopped or cancelled) — mirroring how a Web Animations `finished` promise
   * settles.
   */
  __outcome: 0 | 1 | null = null;

  __callbacks: [() => void, () => void][] = [];

  constructor(
    target: Element | unknown[],
    keyframes?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) {
    if (Array.isArray(target)) {
      // Sequence overload: `animate(sequence, sequenceOptions)`.
      this.element = null;
      this.sequence = target;
      this.keyframes = {};
      this.options = keyframes;
    } else {
      this.element = target;
      this.sequence = null;
      this.keyframes = keyframes ?? {};
      this.options = options;
    }
  }

  play() {
    this.playCount += 1;
    this.state = 'running';
  }

  pause() {
    this.state = 'paused';
  }

  stop() {
    this.state = 'stopped';
    this.__settle(1);
  }

  cancel() {
    this.state = 'cancelled';
    this.__settle(1);
  }

  complete() {
    this.finish();
  }

  /** Settle the thenable as a completed animation, like the real controls do. */
  finish() {
    this.state = 'finished';
    this.__settle(0);
  }

  then(onResolve: () => void, onReject?: () => void) {
    const callbacks: [() => void, () => void] = [onResolve, onReject ?? (() => {})];
    if (this.__outcome !== null) {
      callbacks[this.__outcome]();
      return;
    }
    this.__callbacks.push(callbacks);
  }

  __settle(outcome: 0 | 1) {
    if (this.__outcome !== null) {
      return;
    }
    this.__outcome = outcome;
    for (const callbacks of this.__callbacks) {
      callbacks[outcome]();
    }
    this.__callbacks = [];
  }
}

/** Every animation built since the last {@link resetMockMotion} call, in order. */
export const animations: MockAnimation[] = [];

export const mockAnimate = vi.fn(
  (
    target: Element | unknown[],
    keyframes?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => {
    const animation = new MockAnimation(target, keyframes, options);
    animations.push(animation);
    return animation;
  },
);

/** Every `scroll()` link created since the last {@link resetMockMotion} call. */
export const scrollLinks: Array<{
  animation: MockAnimation;
  options: Record<string, unknown>;
  stop: ReturnType<typeof vi.fn>;
  stopped: boolean;
}> = [];

export const mockScroll = vi.fn((animation: MockAnimation, options: Record<string, unknown>) => {
  const link = { animation, options, stopped: false, stop: vi.fn() };
  link.stop.mockImplementation(() => {
    link.stopped = true;
  });
  scrollLinks.push(link);
  return link.stop;
});

/**
 * Chainable double for the builder `animateView()` returns: it records every
 * subject and layer call in order, runs the update callback when awaited, and
 * settles like the real builder — resolving to an animation exposing a
 * `finished` promise, or rejecting when {@link MockViewBuilder.rejects} is set.
 */
export class MockViewBuilder {
  update: () => void | Promise<void>;
  options: Record<string, unknown> | undefined;
  /** Every builder method call, in order, as `[method, ...args]`. */
  calls: [string, ...unknown[]][] = [];
  /** When `true`, the thenable rejects after running the update. */
  rejects = false;

  constructor(update: () => void | Promise<void>, options?: Record<string, unknown>) {
    this.update = update;
    this.options = options;
  }

  add(...args: unknown[]) {
    return this.__record('add', args);
  }

  new(...args: unknown[]) {
    return this.__record('new', args);
  }

  old(...args: unknown[]) {
    return this.__record('old', args);
  }

  enter(...args: unknown[]) {
    return this.__record('enter', args);
  }

  exit(...args: unknown[]) {
    return this.__record('exit', args);
  }

  layout(...args: unknown[]) {
    return this.__record('layout', args);
  }

  then(resolve: (value: { finished: Promise<void> }) => void, reject?: (reason?: unknown) => void) {
    Promise.resolve(this.update()).then(() => {
      if (this.rejects) {
        reject?.(new Error('view transition rejected'));
        return;
      }
      resolve({ finished: Promise.resolve() });
    });
  }

  __record(method: string, args: unknown[]) {
    this.calls.push([method, ...args]);
    return this;
  }
}

/** Every view builder created since the last {@link resetMockMotion} call. */
export const viewBuilders: MockViewBuilder[] = [];

/** Shared flag copied onto every new {@link MockViewBuilder} as `rejects`. */
export const mockAnimateViewState = { reject: false };

export const mockAnimateView = vi.fn(
  (update: () => void | Promise<void>, options?: Record<string, unknown>) => {
    const builder = new MockViewBuilder(update, options);
    builder.rejects = mockAnimateViewState.reject;
    viewBuilders.push(builder);
    return builder;
  },
);

type GestureStart = (element: Element, info?: unknown) => void | (() => void);

/**
 * A registry per gesture function: the registered start callbacks, so specs
 * can simulate a gesture (`start()` returns the end handler), plus the stop
 * spies returned to the component.
 */
function createGestureMock() {
  const handlers: GestureStart[] = [];
  const stops: ReturnType<typeof vi.fn>[] = [];
  const optionsCalls: unknown[] = [];
  const fn = vi.fn((element: Element, onStart: GestureStart, options?: unknown) => {
    handlers.push(onStart);
    optionsCalls.push(options);
    const stop = vi.fn();
    stops.push(stop);
    return stop;
  });
  function reset() {
    handlers.length = 0;
    stops.length = 0;
    optionsCalls.length = 0;
    fn.mockClear();
  }
  return { fn, handlers, stops, optionsCalls, reset };
}

export const mockHover = createGestureMock();
export const mockPress = createGestureMock();
export const mockInView = createGestureMock();

/**
 * The injected module double. Mutable on purpose: specs can delete members
 * to simulate a `motion/mini` build, then restore them.
 */
export const mockMotionModule = {
  animate: mockAnimate,
  animateView: mockAnimateView,
  scroll: mockScroll,
  hover: mockHover.fn,
  press: mockPress.fn,
  inView: mockInView.fn,
  transformProps,
  readTransformValue,
  getComputedStyle,
};

provideMotion(mockMotionModule as unknown as MotionModule);

export function resetMockMotion() {
  animations.length = 0;
  scrollLinks.length = 0;
  viewBuilders.length = 0;
  mockAnimateViewState.reject = false;
  mockAnimate.mockClear();
  mockAnimateView.mockClear();
  mockScroll.mockClear();
  mockHover.reset();
  mockPress.reset();
  mockInView.reset();
  mockMotionModule.animateView = mockAnimateView;
  mockMotionModule.scroll = mockScroll;
  mockMotionModule.hover = mockHover.fn;
  mockMotionModule.press = mockPress.fn;
  mockMotionModule.inView = mockInView.fn;
}
