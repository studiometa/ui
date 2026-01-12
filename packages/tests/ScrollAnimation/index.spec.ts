import { describe, it, expect } from 'vitest';
import {
  AbstractScrollAnimation,
  ScrollAnimationTimeline,
  ScrollAnimationTarget,
  // Deprecated exports
  ScrollAnimation,
  ScrollAnimationChild,
  ScrollAnimationChildWithEase,
  ScrollAnimationParent,
  ScrollAnimationWithEase,
  animationScrollWithEase,
} from '@studiometa/ui';

describe('ScrollAnimation exports', () => {
  it('should export AbstractScrollAnimation', () => {
    expect(AbstractScrollAnimation).toBeDefined();
    expect(AbstractScrollAnimation.config.name).toBe('AbstractScrollAnimation');
  });

  it('should export ScrollAnimationTimeline', () => {
    expect(ScrollAnimationTimeline).toBeDefined();
    expect(ScrollAnimationTimeline.config.name).toBe('ScrollAnimationTimeline');
  });

  it('should export ScrollAnimationTarget', () => {
    expect(ScrollAnimationTarget).toBeDefined();
    expect(ScrollAnimationTarget.config.name).toBe('ScrollAnimationTarget');
  });

  // Deprecated exports - kept for backward compatibility
  it('should export ScrollAnimation (deprecated)', () => {
    expect(ScrollAnimation).toBeDefined();
    expect(ScrollAnimation.config.name).toBe('ScrollAnimation');
  });

  it('should export ScrollAnimationChild (deprecated)', () => {
    expect(ScrollAnimationChild).toBeDefined();
    expect(ScrollAnimationChild.config.name).toBe('AbstractScrollAnimation');
  });

  it('should export ScrollAnimationChildWithEase (deprecated)', () => {
    expect(ScrollAnimationChildWithEase).toBeDefined();
    expect(ScrollAnimationChildWithEase.config.name).toBe('ScrollAnimationChildWithEase');
  });

  it('should export ScrollAnimationParent (deprecated)', () => {
    expect(ScrollAnimationParent).toBeDefined();
    expect(ScrollAnimationParent.config.name).toBe('ScrollAnimationParent');
  });

  it('should export ScrollAnimationWithEase (deprecated)', () => {
    expect(ScrollAnimationWithEase).toBeDefined();
    expect(ScrollAnimationWithEase.config.name).toBe('ScrollAnimationWithEase');
  });

  it('should export animationScrollWithEase decorator (deprecated)', () => {
    expect(animationScrollWithEase).toBeDefined();
    expect(typeof animationScrollWithEase).toBe('function');
  });
});
