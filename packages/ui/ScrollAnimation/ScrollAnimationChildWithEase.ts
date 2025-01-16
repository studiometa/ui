import type { BaseConfig } from '@studiometa/js-toolkit';
import { ScrollAnimationChild } from './ScrollAnimationChild.js';
import { animationScrollWithEase } from './animationScrollWithEase.js';

/**
 * ScrollAnimationChild class.
 */
export class ScrollAnimationChildWithEase extends animationScrollWithEase(ScrollAnimationChild) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...ScrollAnimationChild.config,
    name: 'ScrollAnimationChildWithEase',
  };
}
