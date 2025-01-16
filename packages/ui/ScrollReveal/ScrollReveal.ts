import { withMountWhenInView, useScroll, ScrollServiceProps } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { Transition } from '../Transition/index.js';

export interface ScrollRevealProps extends BaseProps {
  $refs: {
    target?: HTMLElement;
  };
  $options: {
    repeat: boolean;
  };
}

/**
 * ScrollReveal class.
 */
export class ScrollReveal<T extends BaseProps = BaseProps> extends withMountWhenInView<Transition>(
  Transition,
)<T & ScrollRevealProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
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
   */
  static scrollDirectionY: ScrollServiceProps['direction']['y'] = 'NONE';

  /**
   * Get the transition target.
   */
  get target(): HTMLElement {
    return this.$refs.target ?? this.$el;
  }

  /**
   * Trigger the `enter` transition on mount.
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
