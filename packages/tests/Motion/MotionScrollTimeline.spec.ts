import { describe, it, expect, vi, beforeEach } from 'vitest';
// Importing the mock injects the `motion` module double through `provideMotion`
// before the components resolve it below.
import { animations, mockAnimate, scrollLinks, mockMotionModule, resetMockMotion } from './mock-motion.js';
import { MotionScrollTimeline } from '@studiometa/ui-motion';
import { h, wait } from '#test-utils';

function motionChild(animate: string) {
  return h('div', {
    dataComponent: 'Motion',
    dataOptionAnimate: animate,
    dataOptionNoAutoplay: '',
  });
}

async function mountTimeline(attributes: Record<string, string> = {}, children = 2) {
  const kids = Array.from({ length: children }, (_, index) =>
    motionChild(`{ "x": ${(index + 1) * 100} }`),
  );
  const el = h('section', { dataComponent: 'MotionScrollTimeline', ...attributes }, kids);
  const instance = new MotionScrollTimeline(el);
  await instance.$mount();
  await wait(0);

  return { el, instance };
}

describe('MotionScrollTimeline component', () => {
  beforeEach(() => {
    resetMockMotion();
  });

  it('should have the correct config', () => {
    expect(MotionScrollTimeline.config.name).toBe('MotionScrollTimeline');
    expect(MotionScrollTimeline.config.components).toHaveProperty('Motion');
  });

  it('should bind every Motion child to its own scroll progress', async () => {
    const { el } = await mountTimeline();

    // One animation per child, built from each child's own keyframes.
    expect(mockAnimate).toHaveBeenCalledTimes(2);
    expect(animations[0].keyframes).toEqual({ x: 100 });
    expect(animations[1].keyframes).toEqual({ x: 200 });
    // Created through `seek(0)`: paused, ready to be driven.
    expect(animations.every((animation) => animation.state === 'paused')).toBe(true);

    // One scroll() link per child, tracking the TIMELINE element.
    expect(scrollLinks).toHaveLength(2);
    for (const [index, link] of scrollLinks.entries()) {
      expect(link.animation).toBe(animations[index]);
      expect(link.options.target).toBe(el);
      expect(link.options.axis).toBe('y');
      expect(link.options.offset).toEqual(['start end', 'end start']);
    }
  });

  it('should forward the offset and axis options', async () => {
    await mountTimeline({
      dataOptionOffset: '["start start", "end end"]',
      dataOptionAxis: 'x',
    });

    expect(scrollLinks[0].options.offset).toEqual(['start start', 'end end']);
    expect(scrollLinks[0].options.axis).toBe('x');
  });

  it('should release every scroll link on destroy', async () => {
    const { instance } = await mountTimeline();

    await instance.$destroy();
    expect(scrollLinks.every((link) => link.stopped)).toBe(true);
  });

  it('should warn and leave the children untouched without scroll support', async () => {
    // Simulate a `motion/mini` build: the injected module has no `scroll`.
    mockMotionModule.scroll = undefined as never;

    const kids = [motionChild('{ "x": 100 }')];
    const el = h('section', { dataComponent: 'MotionScrollTimeline' }, kids);
    const instance = new MotionScrollTimeline(el);
    const warn = vi.fn();
    Object.defineProperty(instance, '$warn', { configurable: true, get: () => warn });

    await instance.$mount();
    await wait(0);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(mockAnimate).not.toHaveBeenCalled();
    expect(scrollLinks).toHaveLength(0);
  });
});
