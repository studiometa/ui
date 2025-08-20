import { describe, it, expect } from 'vitest';
import {
  AbstractScrollAnimation,
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

  it('should export ScrollAnimation', () => {
    expect(ScrollAnimation).toBeDefined();
    expect(ScrollAnimation.config.name).toBe('ScrollAnimation');
  });

  it('should export ScrollAnimationChild', () => {
    expect(ScrollAnimationChild).toBeDefined();
    expect(ScrollAnimationChild.config.name).toBe('AbstractScrollAnimation');
  });

  it('should export ScrollAnimationChildWithEase', () => {
    expect(ScrollAnimationChildWithEase).toBeDefined();
    expect(ScrollAnimationChildWithEase.config.name).toBe('ScrollAnimationChildWithEase');
  });

  it('should export ScrollAnimationParent', () => {
    expect(ScrollAnimationParent).toBeDefined();
    expect(ScrollAnimationParent.config.name).toBe('ScrollAnimationParent');
  });

  it('should export ScrollAnimationWithEase', () => {
    expect(ScrollAnimationWithEase).toBeDefined();
    expect(ScrollAnimationWithEase.config.name).toBe('ScrollAnimationWithEase');
  });

  it('should export animationScrollWithEase decorator', () => {
    expect(animationScrollWithEase).toBeDefined();
    expect(typeof animationScrollWithEase).toBe('function');
  });
});