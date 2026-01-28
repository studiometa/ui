import { Base, ScrollInViewProps, withScrolledInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isDev } from '@studiometa/js-toolkit/utils';
import { ScrollAnimationChild } from './ScrollAnimationChild.js';

export interface ScrollAnimationParentProps extends BaseProps {
  $children: {
    ScrollAnimationChild: ScrollAnimationChild[];
  };
}

/**
 * ScrollAnimationParent class.
 *
 * @deprecated Use `ScrollAnimationTimeline` instead.
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
   * Display deprecation warning.
   */
  mounted() {
    if (isDev) {
      console.warn(
        `The ${this.$options.name} component is deprecated.`,
        '\nUse `ScrollAnimationTimeline` instead.',
      );
    }
  }

  /**
   * Scrolled in view hook.
   */
  scrolledInView(props: ScrollInViewProps) {
    for (const child of this.$children.ScrollAnimationChild) {
      child.scrolledInView(props);
    }
  }
}
