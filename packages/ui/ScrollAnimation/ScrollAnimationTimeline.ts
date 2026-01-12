import { Base, ScrollInViewProps, withScrolledInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { ScrollAnimationTarget } from './ScrollAnimationTarget.js';

export interface ScrollAnimationTimelineProps extends BaseProps {
  $children: {
    ScrollAnimationTarget: ScrollAnimationTarget[];
  };
}

/**
 * ScrollAnimationTimeline class.
 *
 * A component that manages scroll-based animations for its children.
 * Use with `ScrollAnimationTarget` children components.
 *
 * @example
 * ```html
 * <div data-component="ScrollAnimationTimeline">
 *   <div data-component="ScrollAnimationTarget" data-option-from='{"opacity": 0}' data-option-to='{"opacity": 1}'>
 *     Content
 *   </div>
 * </div>
 * ```
 */
export class ScrollAnimationTimeline<T extends BaseProps = BaseProps> extends withScrolledInView(
  Base,
  {},
)<T & ScrollAnimationTimelineProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'ScrollAnimationTimeline',
    components: {
      ScrollAnimationTarget,
    },
  };

  /**
   * Scrolled in view hook.
   */
  scrolledInView(props: ScrollInViewProps) {
    for (const child of this.$children.ScrollAnimationTarget) {
      child.scrolledInView(props);
    }
  }
}
