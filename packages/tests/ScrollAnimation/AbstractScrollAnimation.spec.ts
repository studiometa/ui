import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AbstractScrollAnimation } from '@studiometa/ui';
import { h, mount, destroy } from '#test-utils';

class TestScrollAnimation extends AbstractScrollAnimation {
  static config = {
    ...AbstractScrollAnimation.config,
    name: 'TestScrollAnimation',
  };
}

describe('AbstractScrollAnimation', () => {
  let element: HTMLDivElement;
  let animation: TestScrollAnimation;

  beforeEach(async () => {
    element = h('div');
    animation = new TestScrollAnimation(element);
    await mount(animation);
  });

  afterEach(async () => {
    await destroy(animation);
  });

  it('should have the correct default config', () => {
    expect(TestScrollAnimation.config.name).toBe('TestScrollAnimation');
    expect(TestScrollAnimation.config.options.playRange.default()).toEqual([0, 1]);
    expect(TestScrollAnimation.config.options.from.default()).toEqual({});
    expect(TestScrollAnimation.config.options.to.default()).toEqual({});
    expect(TestScrollAnimation.config.options.easing.default()).toEqual([0, 0, 1, 1]);
  });

  it('should return the element as target', () => {
    expect(animation.target).toBe(element);
  });

  it('should create animation with keyframes from from/to options', async () => {
    const testElement = h('div', {
      dataOptionFrom: JSON.stringify({ opacity: 0 }),
      dataOptionTo: JSON.stringify({ opacity: 1 }),
    });
    const testAnimation = new TestScrollAnimation(testElement);
    await mount(testAnimation);
    expect(testAnimation.animation).toBeDefined();
    await destroy(testAnimation);
  });

  it('should create animation with keyframes option', async () => {
    const testElement = h('div', {
      dataOptionKeyframes: JSON.stringify([{ opacity: 0 }, { opacity: 0.5 }, { opacity: 1 }]),
    });
    const testAnimation = new TestScrollAnimation(testElement);
    await mount(testAnimation);
    expect(testAnimation.animation).toBeDefined();
    await destroy(testAnimation);
  });

  it('should calculate play range correctly with 2-element array', async () => {
    const testElement = h('div', {
      dataOptionPlayRange: JSON.stringify([0.2, 0.8]),
    });
    const testAnimation = new TestScrollAnimation(testElement);
    await mount(testAnimation);
    expect(testAnimation.playRange).toEqual([0.2, 0.8]);
    await destroy(testAnimation);
  });

  it('should calculate play range correctly with 3-element array (staggered)', async () => {
    const testElement = h('div', {
      dataOptionPlayRange: JSON.stringify([1, 3, 0.5]),
    });
    const testAnimation = new TestScrollAnimation(testElement);
    await mount(testAnimation);
    const [start, end] = testAnimation.playRange;
    expect(start).toBe(0.5);
    expect(end).toBe(0.5);
    await destroy(testAnimation);
  });

  it('should handle scrolledInView with damped progress', () => {
    const renderSpy = vi.spyOn(animation, 'render');
    
    animation.scrolledInView({
      current: { x: 0, y: 0.5 },
      dampedCurrent: { x: 0, y: 0.5 },
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      dampedProgress: { x: 0, y: 0.5 },
      progress: { x: 0, y: 0.5 },
    });

    expect(renderSpy).toHaveBeenCalledWith(0.5);
  });

  it('should handle scrolledInView with custom play range', async () => {
    const testElement = h('div', {
      dataOptionPlayRange: JSON.stringify([0.25, 0.75]),
    });
    const testAnimation = new TestScrollAnimation(testElement);
    await mount(testAnimation);
    const renderSpy = vi.spyOn(testAnimation, 'render');
    
    testAnimation.scrolledInView({
      current: { x: 0, y: 0.5 },
      dampedCurrent: { x: 0, y: 0.5 },
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      dampedProgress: { x: 0, y: 0.5 },
      progress: { x: 0, y: 0.5 },
    });

    expect(renderSpy).toHaveBeenCalledWith(0.5);
    await destroy(testAnimation);
  });

  it('should render animation with given progress', () => {
    const progressSpy = vi.fn();
    const mockAnimation = { progress: progressSpy };
    
    Object.defineProperty(animation, 'animation', {
      value: mockAnimation,
      configurable: true,
    });

    animation.render(0.75);
    expect(progressSpy).toHaveBeenCalledWith(0.75);
  });
});
