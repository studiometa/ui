import { Base, ScrollInViewProps, withScrolledInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { ScrollAnimationChild } from './ScrollAnimationChild.js';

export interface ScrollAnimationParentProps extends BaseProps {
  $children: {
    ScrollAnimationChild: ScrollAnimationChild[];
  };
}

/**
 * ScrollAnimationParent class.
 */
export class ScrollAnimationParent<T extends BaseProps = BaseProps> extends withScrolledInView(
  Base,
  {},
)<T & ScrollAnimationParentProps> {
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
  scrolledInView(props: ScrollInViewProps) {
    this.$children.ScrollAnimationChild.forEach((child) => {
      child.scrolledInView(props);
    });
  }
}
