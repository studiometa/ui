import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { damp, domScheduler, transform } from '@studiometa/js-toolkit/utils';

/**
 * Manage a slider item and its state transition.
 */
export class SliderItem<T extends BaseProps = BaseProps> extends withIntersectionObserver(Base, {
  threshold: [0, 1],
})<T> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderItem',
    emits: ['is-fully-visible', 'is-partially-visible', 'is-hidden'],
  };

  /**
   * Wether the SliderItem is visible or not.
   * @type {boolean}
   */
  isVisible = false;

  /**
   * The SliderItem `x` position.
   * @type {number}
   */
  x = 0;

  /**
   * The smoothed `x` position.
   * @type {number}
   */
  dampedX = 0;

  /**
   * Item original position.
   */
  rect: {
    x: number;
    y: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };

  /**
   * Set SliderItem bounding rectangle on mount.
   */
  mounted() {
    this.updateRectAdjustedWithX();
  }

  /**
   * Update SliderItem bounding rectangle on resize.
   */
  resized() {
    this.updateRectAdjustedWithX();
  }

  /**
   * Reset position to `0` on destroy.
   */
  destroyed() {
    this.moveInstantly(0);
  }

  /**
   * Intersected hook.
   */
  intersected([{ intersectionRatio, isIntersecting }]: IntersectionObserverEntry[]) {
    if (intersectionRatio >= 1) {
      this.$emit('is-fully-visible');
      this.$el.setAttribute('aria-hidden', 'false');
    } else if (intersectionRatio > 0) {
      this.$emit('is-partially-visible');
      this.$el.setAttribute('aria-hidden', 'true');
    } else {
      this.$emit('is-hidden');
      this.$el.setAttribute('aria-hidden', 'true');
    }

    this.isVisible = isIntersecting;
  }

  /**
   * Ticked hook.
   *
   * @todo create AbstractSliderItem with `render` method
   * @todo add state to SliderItem
   * @todo add origin to SliderItem
   * @returns {void}
   */
  ticked() {
    this.dampedX = damp(this.x, this.dampedX, 0.1, 0.00001);
    this.render();

    if (this.dampedX === this.x) {
      this.$services.disable('ticked');
    }
  }

  /**
   * Enable the SliderItem.
   */
  activate() {
    this.$el.classList.add('is-active');
  }

  /**
   * Disable the SliderItem.
   */
  disactivate() {
    this.$el.classList.remove('is-active');
  }

  /**
   * Move the SliderItem to the given target position.
   */
  move(targetPosition: number) {
    this.x = targetPosition;

    if (!this.$services.has('ticked')) {
      this.$services.enable('ticked');
    }
  }

  /**
   * Move the SliderItem instantly to the given target position.
   */
  moveInstantly(targetPosition: number) {
    this.x = targetPosition;
    this.dampedX = targetPosition;
    this.render();
  }

  /**
   * Render the component.
   */
  render() {
    domScheduler.write(() => {
      transform(this.$el, { x: this.dampedX });
    });
  }

  /**
   * Check if SliderItem is partially visible for the given target position.
   */
  willBeVisible(targetPosition: number) {
    return (
      this.rect.x + targetPosition < window.innerWidth * 1.5 &&
      this.rect.x + targetPosition + this.rect.width > window.innerWidth * -0.5
    );
  }

  /**
   * Check if SliderItem is fully visible for the given target position.
   *
   * @param   {number} targetPosition
   * @returns {boolean}
   */
  willBeFullyVisible(targetPosition) {
    return (
      this.rect.x + targetPosition < window.innerWidth &&
      this.rect.x + targetPosition > 0 &&
      this.rect.x + targetPosition + this.rect.width < window.innerWidth &&
      this.rect.x + targetPosition + this.rect.width > 0
    );
  }

  /**
   * Update the bounding rectangle values without the current transformation.
   *
   * @returns {void}
   */
  updateRectAdjustedWithX() {
    const x = this.x * -1;
    const rect: this['rect'] = this.$el.getBoundingClientRect().toJSON();

    this.rect = {
      ...rect,
      left: rect.left + x,
      right: rect.left + x + rect.width,
      x: rect.left + x,
    };
  }
}
