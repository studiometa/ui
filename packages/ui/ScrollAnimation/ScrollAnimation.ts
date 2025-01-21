import { withScrolledInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { AbstractScrollAnimation } from './AbstractScrollAnimation.js';

export interface ScrollAnimationProps extends BaseProps {
  $refs: {
    target: HTMLElement;
  };
}

/**
 * ScrollAnimation class.
 */
export class ScrollAnimation<
  T extends BaseProps = BaseProps,
> extends withScrolledInView<AbstractScrollAnimation>(AbstractScrollAnimation, {})<
  T & ScrollAnimationProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractScrollAnimation.config,
    name: 'ScrollAnimation',
    refs: ['target'],
  };

  /**
   * Use the `target` ref as animation target.
   */
  get target(): HTMLElement {
    return this.$refs.target;
  }
}
