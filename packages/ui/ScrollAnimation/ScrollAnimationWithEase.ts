import { type BaseConfig } from '@studiometa/js-toolkit';
import { isDev } from '@studiometa/js-toolkit/utils';
import { ScrollAnimation } from './ScrollAnimation.js';
import { animationScrollWithEase } from './animationScrollWithEase.js';

/**
 * ScrollAnimationWithEase class.
 *
 * A `ScrollAnimation` wrapped with the `animationScrollWithEase` mixin, which
 * applies an easing function — selected via its `ease` option (default
 * `outExpo`) — to the scroll progress before rendering. Superseded by the
 * timeline-based API — use `ScrollAnimationTimeline` with `ScrollAnimationTarget`
 * children instead.
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
