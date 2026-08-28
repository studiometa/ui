import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// Importing the mock injects the `motion` module double through `provideMotion`
// before the components resolve it below.
import {
  animations,
  mockAnimate,
  scrollLinks,
  mockMotionModule,
  resetMockMotion,
} from './mock-motion.js';
import { getInstance, registerComponents } from '@studiometa/js-toolkit';
import { captureDiagnostics, resetDom, settle } from '@studiometa/js-toolkit/test';
import { Motion, MotionScrollTimeline } from '@studiometa/ui-motion';
import { h, wait } from '#test-utils';

// v4 does not mount a component's children for it: `config.components` declares
// the family, but every element is mounted by the registry. So the children have
// to be registered, and the whole subtree has to be in the document, for the
// timeline to have anything to bind.
registerComponents(Motion, MotionScrollTimeline);

afterEach(resetDom);

function motionChild(animate: string) {
  return h('div', { dataComponent: 'Motion', dataOptionAnimate: animate });
}

async function mountTimeline(attributes: Record<string, string> = {}, children = 2) {
  const kids = Array.from({ length: children }, (_, index) =>
    motionChild(`{ "x": ${(index + 1) * 100} }`),
  );
  const el = h('section', { dataComponent: 'MotionScrollTimeline', ...attributes }, kids);
  document.body.append(el);
  await settle();
  await wait(0);

  const instance = getInstance<MotionScrollTimeline>(el, 'MotionScrollTimeline')!;

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

  it('should not track the content size by default', async () => {
    await mountTimeline();

    expect(scrollLinks[0].options).not.toHaveProperty('trackContentSize');
  });

  it('should forward the trackContentSize option', async () => {
    await mountTimeline({ dataOptionTrackContentSize: '' });

    for (const link of scrollLinks) {
      expect(link.options.trackContentSize).toBe(true);
    }
  });

  it('should release every scroll link on unmount', async () => {
    const { instance } = await mountTimeline();

    // v4 renamed the inverse of `$mount()`, and the release is now the cleanup
    // the `mounted()` hook returns rather than a `destroyed()` body.
    instance.$unmount();
    expect(scrollLinks.every((link) => link.stopped)).toBe(true);
  });

  it('should warn and leave the children untouched without scroll support', async () => {
    // Simulate a `motion/mini` build: the injected module has no `scroll`.
    mockMotionModule.scroll = undefined as never;

    // `$warn()` reports on the diagnostic channel in v4, so the capture reads
    // the channel rather than stubbing the method or spying on the console.
    const log = captureDiagnostics();
    await mountTimeline({}, 1);

    expect(log.codes).toEqual(['motion-scroll-timeline.missing-scroll']);
    expect(mockAnimate).not.toHaveBeenCalled();
    expect(scrollLinks).toHaveLength(0);
    log.stop();
  });
});
