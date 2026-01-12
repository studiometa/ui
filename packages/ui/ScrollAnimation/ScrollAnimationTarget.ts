import type {
  BaseConfig,
  BaseProps,
  ScrollInViewProps,
  WithScrolledInViewProps,
} from '@studiometa/js-toolkit';
import { damp, clamp01, domScheduler } from '@studiometa/js-toolkit/utils';
import { AbstractScrollAnimation } from './AbstractScrollAnimation.js';

export interface ScrollAnimationTargetProps extends BaseProps {
  $options: WithScrolledInViewProps['$options'];
}

function updateProps(
  // eslint-disable-next-line no-use-before-define
  that: ScrollAnimationTarget,
  props: ScrollInViewProps,
  dampFactor: number,
  dampPrecision: number,
  axis: 'x' | 'y' = 'x',
) {
  that.dampedCurrent[axis] = damp(
    props.current[axis],
    that.dampedCurrent[axis],
    dampFactor,
    dampPrecision,
  );
  that.dampedProgress[axis] = clamp01(
    (that.dampedCurrent[axis] - props.start[axis]) / (props.end[axis] - props.start[axis]),
  );
}

/**
 * ScrollAnimationTarget class.
 *
 * A component that animates based on scroll progress from a parent `ScrollAnimationTimeline`.
 * Each target can have its own animation keyframes and play range.
 *
 * @example
 * ```html
 * <div data-component="ScrollAnimationTimeline">
 *   <div
 *     data-component="ScrollAnimationTarget"
 *     data-option-from='{"opacity": 0, "transform": "translateY(20px)"}'
 *     data-option-to='{"opacity": 1, "transform": "translateY(0)"}'
 *     data-option-play-range='[0, 0.5]'
 *   >
 *     Animated content
 *   </div>
 * </div>
 * ```
 */
export class ScrollAnimationTarget<T extends BaseProps = BaseProps> extends AbstractScrollAnimation<
  T & ScrollAnimationTargetProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    ...AbstractScrollAnimation.config,
    name: 'ScrollAnimationTarget',
    options: {
      ...AbstractScrollAnimation.config.options,
      dampFactor: {
        type: Number,
        default: 0.1,
      },
      dampPrecision: {
        type: Number,
        default: 0.001,
      },
    },
  };

  /**
   * Local damped current values.
   */
  dampedCurrent: ScrollInViewProps['dampedCurrent'] = {
    x: 0,
    y: 0,
  };

  /**
   * Local damped progress.
   */
  dampedProgress: ScrollInViewProps['dampedCurrent'] = {
    x: 0,
    y: 0,
  };

  /**
   * Compute local damped progress.
   */
  scrolledInView(props: ScrollInViewProps) {
    domScheduler.read(() => {
      const { dampFactor, dampPrecision } = this.$options;
      updateProps(this, props, dampFactor, dampPrecision, 'x');
      updateProps(this, props, dampFactor, dampPrecision, 'y');
      props.dampedCurrent = this.dampedCurrent;
      props.dampedProgress = this.dampedProgress;
    });

    domScheduler.write(() => {
      super.scrolledInView(props);
    });
  }
}
