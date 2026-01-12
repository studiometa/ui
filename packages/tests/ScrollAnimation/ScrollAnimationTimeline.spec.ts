import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { ScrollAnimationTimeline, ScrollAnimationTarget } from '@studiometa/ui';
import {
  h,
  mockIsIntersecting,
  intersectionObserverBeforeAllCallback,
  intersectionObserverAfterEachCallback,
} from '#test-utils';

describe('ScrollAnimationTimeline', () => {
  let parentElement: HTMLDivElement;
  let childElement1: HTMLDivElement;
  let childElement2: HTMLDivElement;
  let parent: ScrollAnimationTimeline;

  beforeAll(() => {
    intersectionObserverBeforeAllCallback();
  });

  afterEach(() => {
    intersectionObserverAfterEachCallback();
  });

  beforeEach(async () => {
    parentElement = h('div');
    childElement1 = h('div', { 'data-component': 'ScrollAnimationTarget' });
    childElement2 = h('div', { 'data-component': 'ScrollAnimationTarget' });

    parentElement.appendChild(childElement1);
    parentElement.appendChild(childElement2);

    parent = new ScrollAnimationTimeline(parentElement);
    await mockIsIntersecting(parentElement, true);
  });

  afterEach(async () => {
    await mockIsIntersecting(parentElement, false);
  });

  it('should have the correct config', () => {
    expect(ScrollAnimationTimeline.config.name).toBe('ScrollAnimationTimeline');
    expect(ScrollAnimationTimeline.config.components.ScrollAnimationTarget).toBe(ScrollAnimationTarget);
  });

  it('should have ScrollAnimationTarget components', () => {
    expect(parent.$children.ScrollAnimationTarget).toHaveLength(2);
    expect(parent.$children.ScrollAnimationTarget[0]).toBeInstanceOf(ScrollAnimationTarget);
    expect(parent.$children.ScrollAnimationTarget[1]).toBeInstanceOf(ScrollAnimationTarget);
  });

  it('should propagate scrolledInView to all children', () => {
    const child1Spy = vi.spyOn(parent.$children.ScrollAnimationTarget[0], 'scrolledInView');
    const child2Spy = vi.spyOn(parent.$children.ScrollAnimationTarget[1], 'scrolledInView');

    const mockProps = {
      current: { x: 0.5, y: 0.8 },
      dampedCurrent: { x: 0.4, y: 0.7 },
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      dampedProgress: { x: 0.4, y: 0.7 },
      progress: { x: 0.5, y: 0.8 },
    };

    parent.scrolledInView(mockProps);

    expect(child1Spy).toHaveBeenCalledWith(mockProps);
    expect(child2Spy).toHaveBeenCalledWith(mockProps);
  });

  it('should work with no children', async () => {
    const emptyParent = new ScrollAnimationTimeline(h('div'));
    await mockIsIntersecting(emptyParent.$el, true);

    expect(emptyParent.$children.ScrollAnimationTarget).toHaveLength(0);

    const mockProps = {
      current: { x: 0.5, y: 0.8 },
      dampedCurrent: { x: 0.4, y: 0.7 },
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      dampedProgress: { x: 0.4, y: 0.7 },
      progress: { x: 0.5, y: 0.8 },
    };

    expect(() => emptyParent.scrolledInView(mockProps)).not.toThrow();

    await mockIsIntersecting(emptyParent.$el, false);
  });

  it('should be extended from withScrolledInView(Base)', () => {
    expect(parent.scrolledInView).toBeDefined();
  });
});
