import type { BaseConfig } from '@studiometa/js-toolkit';
import { isDev } from '@studiometa/js-toolkit/utils';
import { ScrollAnimationChild } from './ScrollAnimationChild.js';
import { animationScrollWithEase } from './animationScrollWithEase.js';

/**
 * ScrollAnimationChildWithEase class.
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
