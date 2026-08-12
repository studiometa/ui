import { vi } from 'vitest';
import { provideMotion, type MotionModule } from '@studiometa/ui-motion';

/**
 * Minimal stand-in for the playback controls `motion`'s `animate()` returns:
 * happy-dom has no Web Animations API, so the specs drive completion by hand
 * through {@link MockAnimation.finish}.
 */
export class MockAnimation {
  element: Element;
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
    element: Element,
    keyframes: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) {
    this.element = element;
    this.keyframes = keyframes;
    this.options = options;
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
  (element: Element, keyframes: Record<string, unknown>, options?: Record<string, unknown>) => {
    const animation = new MockAnimation(element, keyframes, options);
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

export const mockScroll = vi.fn(
  (animation: MockAnimation, options: Record<string, unknown>) => {
    const link = { animation, options, stopped: false, stop: vi.fn() };
    link.stop.mockImplementation(() => {
      link.stopped = true;
    });
    scrollLinks.push(link);
    return link.stop;
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
  scroll: mockScroll,
  hover: mockHover.fn,
  press: mockPress.fn,
  inView: mockInView.fn,
};

provideMotion(mockMotionModule as unknown as MotionModule);

export function resetMockMotion() {
  animations.length = 0;
  scrollLinks.length = 0;
  mockAnimate.mockClear();
  mockScroll.mockClear();
  mockHover.reset();
  mockPress.reset();
  mockInView.reset();
  mockMotionModule.scroll = mockScroll;
  mockMotionModule.hover = mockHover.fn;
  mockMotionModule.press = mockPress.fn;
  mockMotionModule.inView = mockInView.fn;
}
