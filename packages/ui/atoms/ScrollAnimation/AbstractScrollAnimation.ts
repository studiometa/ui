import { Base, withFreezedOptions } from '@studiometa/js-toolkit';
import type { BaseTypeParameter, BaseConfig, BaseInterface } from '@studiometa/js-toolkit';
import { map, clamp, animate } from '@studiometa/js-toolkit/utils';
import type { Keyframe } from '@studiometa/js-toolkit/utils';

export interface ScrollAnimationChildInterface extends BaseTypeParameter {
  $options: {
    playRange: string;
    dampFactor: number;
    dampPrecision: number;
    from: Keyframe;
    to: Keyframe;
    keyframes: Keyframe[];
  };
}

/**
 * AbstractScrollAnimation class.
 */
export class AbstractScrollAnimation extends withFreezedOptions<typeof Base, ScrollAnimationChildInterface>(Base) implements BaseInterface {
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
      dampFactor: {
        type: Number,
        default: 0.5,
      },
      dampPrecision: {
        type: Number,
        default: 0.001,
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
  get target():HTMLElement {
    return this.$el;
  }

  animation:ReturnType<typeof animate>;

  /**
   * Mounted hook.
   */
  mounted() {
    let { keyframes } = this.$options;
    const { from, to } = this.$options;

    if (keyframes.length <= 0 && from && to) {
      keyframes = [from, to];
    }

    this.animation = animate(this.target, keyframes, { easing: this.$options.easing });
  }

  scrolledInView(props) {
    const progress = map(
      clamp(props.dampedProgress.y, this.$options.playRange[0], this.$options.playRange[1]),
      this.$options.playRange[0],
      this.$options.playRange[1],
      0,
      1,
    );

    this.render(progress);
  }

  /**
   * Render the animation for the given progress.
   */
  render(progress:number) {
    this.animation.progress(progress);
  }
}
