import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { ScrollAnimation } from '@studiometa/ui';
import {
  h,
  mockIsIntersecting,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
} from '#test-utils';

describe('ScrollAnimation', () => {
  let element: HTMLDivElement;
  let targetElement: HTMLDivElement;
  let animation: ScrollAnimation;

  beforeAll(() => {
    intersectionObserverBeforeAllCallback();
  });

  afterEach(() => {
    intersectionObserverAfterEachCallback();
  });

  beforeEach(async () => {
    targetElement = h('div', { dataRef: 'target' });
    element = h('div', [targetElement]);
    animation = new ScrollAnimation(element);
    await mockIsIntersecting(element, true);
  });

  afterEach(async () => {
    await mockIsIntersecting(element, false);
  });

  it('should have the correct config', () => {
    expect(ScrollAnimation.config.name).toBe('ScrollAnimation');
    expect(ScrollAnimation.config.refs).toEqual(['target']);
  });

  it('should use the target ref as animation target', async () => {
    expect(animation.$refs.target).toBe(targetElement);
    expect(animation.target).toBe(targetElement);
  });

  it('should inherit from AbstractScrollAnimation', () => {
    expect(animation).toBeInstanceOf(ScrollAnimation);
    expect(animation.scrolledInView).toBeDefined();
    expect(animation.render).toBeDefined();
  });

  it('should have default playRange', () => {
    expect(animation.playRange).toEqual([0, 1]);
  });

  it('should create animation lazily', () => {
    expect(() => animation.animation).not.toThrow();
  });
});
