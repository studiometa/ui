import { type BaseConfig } from '@studiometa/js-toolkit';
import { isDev } from '@studiometa/js-toolkit/utils';
import { ScrollAnimation } from './ScrollAnimation.js';
import { animationScrollWithEase } from './animationScrollWithEase.js';

/**
 * ScrollAnimationWithEase class.
 *
 * @deprecated Use `ScrollAnimationTimeline` with `ScrollAnimationTarget` children instead.
 */
export class ScrollAnimationWithEase extends animationScrollWithEase(ScrollAnimation) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...ScrollAnimation.config,
    name: 'ScrollAnimationWithEase',
  };

  /**
   * Display deprecation warning.
   */
  mounted() {
    if (isDev) {
      console.warn(
        `The ${this.$options.name} component is deprecated.`,
        '\nUse `ScrollAnimationTimeline` with `ScrollAnimationTarget` children instead.',
      );
    }
  }
}
