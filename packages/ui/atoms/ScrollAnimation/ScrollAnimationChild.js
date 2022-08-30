import { damp } from '@studiometa/js-toolkit/utils';
import AbstractScrollAnimation from './AbstractScrollAnimation.js';

/**
 * ScrollAnimationChild class.
 */
export default class ScrollAnimationChild extends AbstractScrollAnimation {
  /**
   * Config.
   */
  static config = {
    name: 'ScrollAnimationChild',
    ...AbstractScrollAnimation.config,
  };

  /**
   * Local damped progress.
   */
  dampedProgress = {
    x: 0,
    y: 0,
  };

  /**
   * Compute local damped progress.
   */
  scrolledInView(props) {
    this.dampedProgress.y = damp(
      props.progress.y,
      this.dampedProgress.y,
      this.$options.dampFactor,
      this.$options.dampPrecision,
    );
    this.dampedProgress.x = damp(
      props.progress.x,
      this.dampedProgress.x,
      this.$options.dampFactor,
      this.$options.dampPrecision,
    );

    props.dampedProgress = this.dampedProgress;
    super.scrolledInView(props);
  }
}
