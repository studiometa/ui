import { describe, it, expect, beforeEach } from 'vitest';
// Importing the mock injects the `motion` module double through `provideMotion`
// before the component resolves it below.
import { animations, mockAnimate, resetMockMotion } from './mock-motion.js';
import { Motion } from '@studiometa/ui-motion';
import { h, wait } from '#test-utils';

/**
 * Record how many times each named event fires on the element, keeping the
 * `detail` payloads so bubbling `CustomEvent`s can be asserted like an `Action`
 * would consume them.
 */
function listen(el: HTMLElement, ...names: string[]) {
  const calls: Record<string, number> = {};

  for (const name of names) {
    calls[name] = 0;
    el.addEventListener(name, () => {
      calls[name] += 1;
    });
  }

  return { calls };
}

const EVENTS = ['motion-play', 'motion-pause', 'motion-complete', 'motion-cancel', 'motion-stop'];

/**
 * Build a `Motion` element, attach listeners, then mount and flush the
 * microtask queue so the async `mounted()` (and its `autoplay`) has run.
 */
async function mountMotion(attributes: Record<string, string> = {}, events: string[] = EVENTS) {
  const el = h('div', { dataComponent: 'Motion', ...attributes });
  const recorder = listen(el, ...events);
  const instance = new Motion(el);
  await instance.$mount();
  await wait(0);

  return { el, instance, ...recorder };
}

describe('Motion component', () => {
  beforeEach(() => {
    resetMockMotion();
  });

  it('should have the correct config', () => {
    expect(Motion.config.name).toBe('Motion');
    expect(Motion.config.emits).toEqual(EVENTS);
  });

  it('should apply the initial styles on mount without playing', async () => {
    const { el, calls } = await mountMotion({
      dataOptionInitial: '{ "opacity": 0 }',
      dataOptionAutoplay: '',
    });

    expect(mockAnimate).toHaveBeenCalledTimes(1);
    expect(mockAnimate).toHaveBeenCalledWith(el, { opacity: 0 }, { duration: 0 });
    expect(calls['motion-play']).toBe(0);
  });

  it('should start each keyframe at its initial style so a replay repeats the motion', async () => {
    const { el } = await mountMotion({
      dataOptionInitial: '{ "opacity": 0, "y": 24 }',
      dataOptionAnimate: '{ "opacity": 1, "y": 0 }',
      dataOptionAutoplay: '',
    });

    // The `initial` styles are applied first, then folded into the keyframes
    // as the starting point of the declared animation.
    expect(mockAnimate).toHaveBeenNthCalledWith(1, el, { opacity: 0, y: 24 }, { duration: 0 });
    expect(mockAnimate).toHaveBeenNthCalledWith(
      2,
      el,
      { opacity: [0, 1], y: [24, 0] },
      {},
    );
  });

  it('should keep explicit keyframe arrays and properties absent from initial', async () => {
    const { el } = await mountMotion({
      dataOptionInitial: '{ "opacity": 0 }',
      dataOptionAnimate: '{ "opacity": [0.2, 1], "x": 100 }',
      dataOptionAutoplay: '',
    });

    // The array wins over `initial`, and `x` — which `initial` says nothing
    // about — keeps animating from the current state.
    expect(mockAnimate).toHaveBeenNthCalledWith(2, el, { opacity: [0.2, 1], x: 100 }, {});
  });

  it('should autoplay the animate keyframes with the transition options when enabled', async () => {
    const { el, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionTransition: '{ "duration": 1 }',
      dataOptionAutoplay: '',
    });

    expect(mockAnimate).toHaveBeenCalledTimes(1);
    expect(mockAnimate).toHaveBeenCalledWith(el, { x: 100 }, { duration: 1 });
    expect(calls['motion-play']).toBe(1);

    animations[0].finish();
    await wait(0);
    expect(calls['motion-complete']).toBe(1);
  });

  it('should not autoplay by default, and play on demand', async () => {
    const { instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
    });

    expect(instance.$options.autoplay).toBe(false);
    expect(mockAnimate).not.toHaveBeenCalled();

    const settled = instance.play();
    await wait(0);
    expect(mockAnimate).toHaveBeenCalledTimes(1);
    expect(calls['motion-play']).toBe(1);

    animations[0].finish();
    await settled;
    expect(calls['motion-complete']).toBe(1);
  });

  it('should replay the same animation on repeated play calls', async () => {
    const { instance } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionAutoplay: '',
    });

    instance.play();
    await wait(0);

    expect(mockAnimate).toHaveBeenCalledTimes(1);
    expect(animations[0].playCount).toBe(2);
  });

  it('should reverse from the end when nothing has played yet', async () => {
    const { instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
    });

    instance.reverse();
    await wait(0);

    expect(mockAnimate).toHaveBeenCalledTimes(1);
    const [animation] = animations;
    expect(animation.time).toBe(animation.duration);
    expect(animation.speed).toBe(-1);
    expect(calls['motion-play']).toBe(1);
  });

  it('should flip the playback direction with reverse and play', async () => {
    const { instance } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionAutoplay: '',
    });

    instance.reverse();
    await wait(0);
    expect(animations[0].speed).toBe(-1);

    instance.play();
    await wait(0);
    expect(animations[0].speed).toBe(1);
  });

  it('should pause the current animation, and ignore pause when idle', async () => {
    const { instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
    });

    instance.pause();
    expect(calls['motion-pause']).toBe(0);

    instance.play();
    await wait(0);
    instance.pause();

    expect(animations[0].state).toBe('paused');
    expect(calls['motion-pause']).toBe(1);
  });

  it('should replace the current animation with an imperative animate call', async () => {
    const { el, instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionTransition: '{ "duration": 1 }',
      dataOptionAutoplay: '',
    });

    instance.animate({ y: 50 }, { duration: 3 });
    await wait(0);

    expect(mockAnimate).toHaveBeenCalledTimes(2);
    expect(mockAnimate).toHaveBeenLastCalledWith(el, { y: 50 }, { duration: 3 });
    expect(animations[0].state).toBe('stopped');

    // The superseded animation settling must not emit `motion-complete`.
    animations[0].finish();
    await wait(0);
    expect(calls['motion-complete']).toBe(0);

    animations[1].finish();
    await wait(0);
    expect(calls['motion-complete']).toBe(1);
  });

  it('should return to the declared animation after an imperative animate call', async () => {
    const { el, instance } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionTransition: '{ "duration": 1 }',
      dataOptionAutoplay: '',
    });

    instance.animate({ rotate: 360 });
    await wait(0);
    expect(mockAnimate).toHaveBeenCalledTimes(2);

    // `play()` recreates the animation declared by the options, stopping the
    // imperative one.
    instance.play();
    await wait(0);
    expect(mockAnimate).toHaveBeenCalledTimes(3);
    expect(mockAnimate).toHaveBeenLastCalledWith(el, { x: 100 }, { duration: 1 });
    expect(animations[1].state).toBe('stopped');

    // Same for `reverse()`, created at its end to play backward.
    instance.animate({ y: 50 });
    await wait(0);
    instance.reverse();
    await wait(0);
    expect(mockAnimate).toHaveBeenCalledTimes(5);
    expect(mockAnimate).toHaveBeenLastCalledWith(el, { x: 100 }, { duration: 1 });
    expect(animations[4].speed).toBe(-1);
    expect(animations[4].time).toBe(animations[4].duration);
  });

  it('should stop the current animation and create a fresh one on the next play', async () => {
    const { instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionAutoplay: '',
    });

    instance.stop();
    expect(animations[0].state).toBe('stopped');
    expect(calls['motion-stop']).toBe(1);
    expect(calls['motion-complete']).toBe(0);

    instance.play();
    await wait(0);
    expect(mockAnimate).toHaveBeenCalledTimes(2);
  });

  it('should cancel the current animation', async () => {
    const { instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionAutoplay: '',
    });

    instance.cancel();
    expect(animations[0].state).toBe('cancelled');
    expect(calls['motion-cancel']).toBe(1);
    expect(calls['motion-complete']).toBe(0);
  });

  it('should jump to the end state with complete', async () => {
    const { instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionAutoplay: '',
    });

    instance.complete();
    await wait(0);
    expect(animations[0].state).toBe('finished');
    expect(calls['motion-complete']).toBe(1);
  });

  it('should seek the current animation, creating it paused when idle', async () => {
    const { instance } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
    });

    await instance.seek(0.5);
    expect(mockAnimate).toHaveBeenCalledTimes(1);
    const [animation] = animations;
    expect(animation.state).toBe('paused');
    expect(animation.time).toBe(animation.duration * 0.5);
    expect(instance.progress).toBe(0.5);

    await instance.seek(2);
    expect(animation.time).toBe(animation.duration);
  });

  it('should expose the playback state through getters', async () => {
    const { instance } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
    });

    expect(instance.controls).toBeNull();
    expect(instance.time).toBe(0);
    expect(instance.duration).toBe(0);
    expect(instance.progress).toBe(0);

    instance.play();
    await wait(0);

    expect(instance.controls).toBe(animations[0]);
    expect(instance.duration).toBe(animations[0].duration);
  });

  it('should dispatch bubbling events', async () => {
    const el = h('div', {
      dataComponent: 'Motion',
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionAutoplay: '',
    });
    const parent = h('div', [el]);
    let bubbled = 0;
    parent.addEventListener('motion-play', () => {
      bubbled += 1;
    });

    const instance = new Motion(el);
    await instance.$mount();
    await wait(0);

    expect(bubbled).toBe(1);
  });

  it('should stop the current animation on destroy without completing', async () => {
    const { instance, calls } = await mountMotion({
      dataOptionAnimate: '{ "x": 100 }',
      dataOptionAutoplay: '',
    });

    await instance.$destroy();
    expect(animations[0].state).toBe('stopped');
    expect(instance.controls).toBeNull();

    animations[0].finish();
    await wait(0);
    expect(calls['motion-complete']).toBe(0);
  });
});
