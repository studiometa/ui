import { Base, withScrolledInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseTypeParameter } from '@studiometa/js-toolkit';
import { ScrollAnimationChild } from './ScrollAnimationChild.js';

export interface ScrollAnimationParentInterface extends BaseTypeParameter {
  $children: {
    ScrollAnimationChild: ScrollAnimationChild[];
  };
}

/**
 * ScrollAnimationParent class.
 */
export class ScrollAnimationParent extends withScrolledInView<
  typeof Base,
  ScrollAnimationParentInterface
>(Base, {}) {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'ScrollAnimationParent',
    components: {
      ScrollAnimationChild,
    },
  };

  /**
   * Scrolled in view hook.
   */
  scrolledInView(props) {
    this.$children.ScrollAnimationChild.forEach((child) => {
      child.scrolledInView(props);
    });
  }
}
