import { withMountWhenInView } from '@studiometa/js-toolkit';
import { Transition } from '../../primitives/index.js';

/**
 * @typedef {ScrollReveal & {
 *   $refs: {
 *     target?: HTMLElement,
 *   },
 * }} ScrollRevealInterface
 */

/**
 * ScrollReveal class.
 */
export default class ScrollReveal extends withMountWhenInView(Transition) {
  /**
   * Config.
   */
  static config = {
    ...Transition.config,
    name: 'ScrollReveal',
    refs: ['target'],
    options: {
      ...Transition.config.options,
      enterKeep: {
        type: Boolean,
        default: true,
      },
      intersectionObserver: {
        type: Object,
        default: () => ({ threshold: [0, 1] }),
      },
    },
  };

  /**
   * Get the transition target.
   *
   * @this {ScrollRevealInterface}
   * @returns {HTMLElement}
   */
  get target() {
    return this.$refs.target ?? this.$el;
  }

  /**
   * Trigger the `enter` transition on mount.
   *
   * @this {ScrollRevealInterface}
   * @returns {void}
   */
  mounted() {
    this.enter();
    this.$terminate();
  }
}
