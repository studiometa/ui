import { withMountWhenInView, useScroll } from '@studiometa/js-toolkit';
import { Transition } from '../../primitives/index.js';

/**
 * @typedef {ScrollReveal & {
 *   $refs: {
 *     target?: HTMLElement,
 *   },
 *   $options: {
 *     repeat: boolean;
 *   }
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
      repeat: Boolean,
      intersectionObserver: {
        type: Object,
        default: () => ({ threshold: [0, 1] }),
      },
    },
  };

  /**
   * Vertical scroll direction.
   * @type {'UP'|'DOWN'|'NONE'}
   */
  static scrollDirectionY = 'NONE';

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
    if (!this.$options.repeat) {
      this.enter();
      this.$terminate();
      return;
    }

    const scroll = useScroll();

    if (!scroll.has('ScrollRevealRepeat')) {
      scroll.add('ScrollRevealRepeat', (props) => {
        ScrollReveal.scrollDirectionY = props.direction.y;
      });
    }

    if (ScrollReveal.scrollDirectionY !== 'UP') {
      this.enter();
    }
  }
}
