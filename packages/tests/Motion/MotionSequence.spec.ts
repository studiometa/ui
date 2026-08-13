import { describe, it, expect, beforeEach } from 'vitest';
// Importing the mock injects the `motion` module double through `provideMotion`
// before the components resolve it below.
import { animations, mockAnimate, resetMockMotion } from './mock-motion.js';
import { MotionSequence } from '@studiometa/ui-motion';
import { h, wait } from '#test-utils';

function motionChild(attributes: Record<string, string>) {
  return h('div', { dataComponent: 'Motion', ...attributes });
}

async function mountSequence(
  attributes: Record<string, string> = {},
  children: Array<Record<string, string>> = [
    { dataOptionAnimate: '{ "x": 100 }' },
    { dataOptionAnimate: '{ "y": 50 }', dataOptionTransition: '{ "duration": 1 }' },
  ],
) {
  const kids = children.map(motionChild);
  const el = h('div', { dataComponent: 'MotionSequence', ...attributes }, kids);
  const instance = new MotionSequence(el);
  await instance.$mount();
  await wait(0);

  return { el, instance, kids };
}

describe('MotionSequence component', () => {
  beforeEach(() => {
    resetMockMotion();
  });

  it('should have the correct config', () => {
    expect(MotionSequence.config.name).toBe('MotionSequence');
    expect(MotionSequence.config.components).toHaveProperty('Motion');
  });

  it('should autoplay one sequence built from the children in DOM order', async () => {
    const { el, kids } = await mountSequence({ dataOptionAutoplay: '' });
    let played = 0;
    el.addEventListener('motion-play', () => (played += 1));

    expect(mockAnimate).toHaveBeenCalledTimes(1);
    const [animation] = animations;
    expect(animation.sequence).toEqual([
      [kids[0], { x: 100 }, {}],
      [kids[1], { y: 50 }, { duration: 1 }],
    ]);
    // No transition on the sequence element: no sequence-level options.
    expect(animation.options).toBeUndefined();
  });

  it('should start each segment at its child initial styles', async () => {
    const { kids } = await mountSequence({ dataOptionAutoplay: '' }, [
      { dataOptionInitial: '{ "opacity": 0 }', dataOptionAnimate: '{ "opacity": 1 }' },
      { dataOptionAnimate: '{ "y": 50 }' },
    ]);

    // The child's `initial` styles are their own `animate()` call, so the
    // sequence is picked by shape rather than by index.
    const sequenced = animations.find((animation) => animation.sequence);

    expect(sequenced.sequence).toEqual([
      // Folded from `initial`, so replaying the sequence repeats the motion.
      [kids[0], { opacity: [0, 1] }, {}],
      // No `initial`: the segment still animates from the current state.
      [kids[1], { y: 50 }, {}],
    ]);
  });

  it('should position segments with the at option, parsing numbers', async () => {
    const { kids } = await mountSequence({ dataOptionAutoplay: '' }, [
      { dataOptionAnimate: '{ "x": 100 }', dataOptionAt: '0.5' },
      { dataOptionAnimate: '{ "y": 50 }', dataOptionAt: '<' },
    ]);

    expect(animations[0].sequence).toEqual([
      [kids[0], { x: 100 }, { at: 0.5 }],
      [kids[1], { y: 50 }, { at: '<' }],
    ]);
  });

  it('should spread the segments with stagger, explicit at winning', async () => {
    const { kids } = await mountSequence({ dataOptionStagger: '0.2', dataOptionAutoplay: '' }, [
      { dataOptionAnimate: '{ "x": 100 }' },
      { dataOptionAnimate: '{ "y": 50 }' },
      { dataOptionAnimate: '{ "rotate": 90 }', dataOptionAt: '2' },
    ]);

    expect(animations[0].sequence).toEqual([
      [kids[0], { x: 100 }, { at: 0 }],
      [kids[1], { y: 50 }, { at: 0.2 }],
      [kids[2], { rotate: 90 }, { at: 2 }],
    ]);
  });

  it('should pass its transition as the sequence options', async () => {
    await mountSequence({ dataOptionTransition: '{ "duration": 3 }', dataOptionAutoplay: '' });
    expect(animations[0].options).toEqual({ duration: 3 });
  });

  it('should skip children without keyframes and not autoplay when none remain', async () => {
    await mountSequence({ dataOptionAutoplay: '' }, [{}, {}]);
    expect(mockAnimate).not.toHaveBeenCalled();
  });

  it('should drive the whole sequence with the inherited playback surface', async () => {
    const { instance } = await mountSequence();
    expect(mockAnimate).not.toHaveBeenCalled();

    instance.play();
    await wait(0);
    expect(mockAnimate).toHaveBeenCalledTimes(1);
    expect(instance.controls).toBe(animations[0]);

    instance.reverse();
    await wait(0);
    expect(animations[0].speed).toBe(-1);
    expect(mockAnimate).toHaveBeenCalledTimes(1);
  });
});
