import { type BaseConfig } from '@studiometa/js-toolkit';
import { ScrollAnimation } from './ScrollAnimation.js';
import { animationScrollWithEase } from './animationScrollWithEase.js';

/**
 * ScrollAnimation class.
 */
export class ScrollAnimationWithEase extends animationScrollWithEase(ScrollAnimation) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...ScrollAnimation.config,
    name: 'ScrollAnimationWithEase',
  };
}
