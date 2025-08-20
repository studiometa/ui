import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScrollAnimationChild } from '@studiometa/ui';
import { h, mount, destroy } from '#test-utils';

describe('ScrollAnimationChild', () => {
  let element: HTMLDivElement;
  let animation: ScrollAnimationChild;

  beforeEach(async () => {
    element = h('div');
    animation = new ScrollAnimationChild(element);
    await mount(animation);
  });

  afterEach(async () => {
    await destroy(animation);
  });

  it('should have the correct config', () => {
    expect(ScrollAnimationChild.config.name).toBe('AbstractScrollAnimation');
    expect(ScrollAnimationChild.config.options.dampFactor.default).toBe(0.1);
    expect(ScrollAnimationChild.config.options.dampPrecision.default).toBe(0.001);
  });

  it('should initialize with correct default damped values', () => {
    expect(animation.dampedCurrent).toEqual({ x: 0, y: 0 });
    expect(animation.dampedProgress).toEqual({ x: 0, y: 0 });
  });

  it('should have damping options accessible', () => {
    expect(animation.$options.dampFactor).toBe(0.1);
    expect(animation.$options.dampPrecision).toBe(0.001);
  });

  it('should override scrolledInView method', () => {
    const mockProps = {
      current: { x: 0.5, y: 0.8 },
      dampedCurrent: { x: 0.4, y: 0.7 },
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      dampedProgress: { x: 0.4, y: 0.7 },
      progress: { x: 0.5, y: 0.8 },
    };

    expect(() => animation.scrolledInView(mockProps)).not.toThrow();
  });

  it('should inherit from AbstractScrollAnimation', () => {
    expect(animation.render).toBeDefined();
    expect(animation.target).toBe(element);
    expect(animation.playRange).toEqual([0, 1]);
  });
});
