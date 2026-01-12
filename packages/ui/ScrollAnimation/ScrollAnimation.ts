import { withScrolledInView } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { isDev } from '@studiometa/js-toolkit/utils';
import { AbstractScrollAnimation } from './AbstractScrollAnimation.js';

export interface ScrollAnimationProps extends BaseProps {
  $refs: {
    target: HTMLElement;
  };
}

/**
 * ScrollAnimation class.
 *
 * @deprecated Use `ScrollAnimationTimeline` with `ScrollAnimationTarget` children instead.
 * @link https://ui.studiometa.dev/components/ScrollAnimation/
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

  /**
   * Display deprecation warning.
   */
  mounted() {
    if (isDev) {
      console.warn(
        `The ${this.$options.name} component is deprecated.`,
        '\nUse `ScrollAnimationTimeline` with `ScrollAnimationTarget` children instead.',
      );
    }
  }
}
