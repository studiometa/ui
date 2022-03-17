import { Base, withScrolledInView } from '@studiometa/js-toolkit';
import ScrollAnimationChild from './ScrollAnimationChild.js';

/**
 * @typedef {ScrollAnimationParent & {
 *   $children: {
 *     ScrollAnimationChild: ScrollAnimationChild[],
 *   },
 * }} ScrollAnimationInterface
 */

/**
 * ScrollAnimationParent class.
 */
export default class ScrollAnimationParent extends withScrolledInView(Base, {}) {
  /**
   * Config.
   */
  static config = {
    name: 'ScrollAnimationParent',
    components: {
      ScrollAnimationChild,
    },
  };

  /**
   * @todo Optimize default value read
   * @todo do not add unnecessary styles
   * @todo freeze options for better perf
   * @this {ScrollAnimationInterface}
   */
  scrolledInView(props) {
    this.$children.ScrollAnimationChild.forEach((child) => {
      child.scrolledInView(props);
    });
  }
}
