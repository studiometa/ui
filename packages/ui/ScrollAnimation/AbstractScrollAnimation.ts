import { Base, withFreezedOptions } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig, ScrollInViewProps } from '@studiometa/js-toolkit';
import { map, clamp01, animate } from '@studiometa/js-toolkit/utils';
import type { Keyframe } from '@studiometa/js-toolkit/utils';

export interface AbstractScrollAnimationProps extends BaseProps {
  $options: {
    playRange: [number, number] | [number, number, number];
    from: Keyframe;
    to: Keyframe;
    keyframes: Keyframe[];
    easing: [number, number, number, number];
  };
}

/**
 * AbstractScrollAnimation class.
 */
export class AbstractScrollAnimation<
  T extends BaseProps = BaseProps,
> extends withFreezedOptions<Base>(Base)<T & AbstractScrollAnimationProps> {
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
  get animation(): ReturnType<typeof animate> {
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

  get playRange(): [number, number] {
    const { playRange } = this.$options;

    let start = 0;
    let end = 1;

    if (playRange.length === 3) {
      const [index, length, step] = playRange;
      const clampedStep = clamp01(step);
      const duration = Math.max(0, 1 - clampedStep * (length - 1));
      start = clampedStep * index;
      end = Math.min(1, start + duration);
    } else if (playRange.length === 2) {
      [start, end] = playRange;
    }

    return [start, end];
  }

  scrolledInView({ dampedProgress }: ScrollInViewProps) {
    const [start, end] = this.playRange;
    this.render(clamp01(map(dampedProgress.y, start, end, 0, 1)));
  }

  /**
   * Render the animation for the given progress.
   */
  render(progress: number) {
    this.animation.progress(progress);
  }
}
