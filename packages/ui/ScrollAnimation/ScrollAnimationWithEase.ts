import { ScrollAnimation } from './ScrollAnimation.js';
import { animationScrollWithEase } from './animationScrollWithEase.js';

/**
 * ScrollAnimation class.
 */
export class ScrollAnimationWithEase extends animationScrollWithEase(ScrollAnimation) {
  /**
   * Config.
   */
  static config = {
    ...ScrollAnimation.config,
    name: 'ScrollAnimationWithEase',
  };
}
