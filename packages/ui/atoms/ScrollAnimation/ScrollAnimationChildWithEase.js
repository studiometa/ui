import ScrollAnimationChild from './ScrollAnimationChild.js';
import animationScrollWithEase from './animationScrollWithEase.js';

/**
 * ScrollAnimationChild class.
 */
export default class ScrollAnimationChildWithEase extends animationScrollWithEase(
  ScrollAnimationChild,
) {
  /**
   * Config.
   */
  static config = {
    ...ScrollAnimationChild.config,
    name: 'ScrollAnimationChildWithEase',
  };
}
