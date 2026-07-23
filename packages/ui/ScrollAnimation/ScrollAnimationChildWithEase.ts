import type { BaseConfig } from '@studiometa/js-toolkit';
import { isDev } from '@studiometa/js-toolkit/utils';
import { ScrollAnimationChild } from './ScrollAnimationChild.js';
import { animationScrollWithEase } from './animationScrollWithEase.js';

/**
 * ScrollAnimationChildWithEase class.
 *
 * A `ScrollAnimationChild` wrapped with the `animationScrollWithEase` mixin,
 * which applies an easing function — selected via its `ease` option (default
 * `outExpo`) — to the child's damped scroll progress before rendering.
 * Superseded by the timeline-based API — use `ScrollAnimationTarget` instead.
 *
 * @deprecated Use `ScrollAnimationTarget` instead.
 */
export class ScrollAnimationChildWithEase extends animationScrollWithEase(ScrollAnimationChild) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...ScrollAnimationChild.config,
    name: 'ScrollAnimationChildWithEase',
  };

  /**
   * Display deprecation warning.
   */
  mounted() {
    if (isDev) {
      console.warn(
        `The ${this.$options.name} component is deprecated.`,
        '\nUse `ScrollAnimationTarget` instead.',
      );
    }
  }
}
