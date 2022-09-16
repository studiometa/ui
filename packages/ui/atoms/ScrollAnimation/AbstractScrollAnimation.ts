import { Base, withFreezedOptions } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, ScrollInViewProps } from '@studiometa/js-toolkit';
import { map, clamp, animate } from '@studiometa/js-toolkit/utils';
import type { Keyframe } from '@studiometa/js-toolkit/utils';

export interface AbstractScrollAnimationProps extends BaseProps {
  $options: {
    playRange: [number, number];
    from: Keyframe;
    to: Keyframe;
    keyframes: Keyframe[];
  };
}

/**
 * AbstractScrollAnimation class.
 */
export class AbstractScrollAnimation<T extends BaseProps = BaseProps> extends withFreezedOptions<Base>(Base)<T & AbstractScrollAnimationProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractScrollAnimation',
    options: {
      playRange: {
        type: Array,
        default: () => [0, 1],
      },
      from: {
        type: Object,
        default: () => ({}),
      },
      to: {
        type: Object,
        default: () => ({}),
      },
      keyframes: {
        type: Array,
      },
      easing: {
        type: Array,
        default: () => [0, 0, 1, 1],
      },
    },
  };

  /**
   * Get the target element for the animation.
   */
  get target() {
    return this.$el as HTMLElement;
  }

  /**
   * Lazily get animation.
   */
  get animation():ReturnType<typeof animate> {
    let { keyframes } = this.$options;
    const { from, to } = this.$options;

    if (keyframes.length <= 0 && from && to) {
      keyframes = [from, to];
    }

    const animation = animate(this.target, keyframes, { easing: this.$options.easing });

    Object.defineProperty(this, 'animation', {
      value: animation,
      configurable: true,
    });

    return animation;
  }

  scrolledInView(props:ScrollInViewProps) {
    const progress = map(
      clamp(props.dampedProgress.y, this.$options.playRange[0], this.$options.playRange[1]),
      this.$options.playRange[0],
      this.$options.playRange[1],
      0,
      1,
    );

    this.$options.playRange = [0, 0];

    this.render(progress);
  }

  /**
   * Render the animation for the given progress.
   */
  render(progress:number) {
    this.animation.progress(progress);
  }
}
