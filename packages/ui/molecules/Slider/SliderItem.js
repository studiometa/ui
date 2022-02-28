import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';
import { matrix, damp } from '@studiometa/js-toolkit/utils';

/**
 * Manage a slider item and its state transition.
 */
export default class SliderItem extends withIntersectionObserver(Base, { threshold: [0, 1] }) {
  static config = {
    name: 'SliderItem',
    emits: ['is-fully-visible', 'is-partially-visible', 'is-hidden'],
  };

  isVisible = false;

  x = 0;

  dampedX = 0;

  /**
   * mounted hook
   */
  mounted() {
    this.updateRectAdjustedWithX();
  }

  /**
   * Destroyed hook
   */
  destroyed() {
    this.moveInstantly(0);
  }

  /**
   * rezised hook
   */
  resized() {
    this.updateRectAdjustedWithX();
  }

  /**
   * Update Rect
   */
  updateRectAdjustedWithX() {
    const x = this.x * -1;
    const rect = this.$el.getBoundingClientRect().toJSON();

    this.rect = {
      ...rect,
      left: rect.left + x,
      right: rect.left + x + rect.width,
      x: rect.left + x,
    };
  }

  /**
   * Intersected hook
   */
  intersected([{ intersectionRatio, isIntersecting }]) {
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
   * Move sliderItem
   */
  move(target) {
    this.x = target;

    if (!this.$services.has('ticked')) {
      this.$services.enable('ticked');
    }
  }

  /**
   * Ticked hook.
   *
   * @returns {void}
   */
  ticked() {
    this.dampedX = damp(this.x, this.dampedX, 0.2, 0.00001);
    this.$el.style.transform = `${matrix({
      translateX: this.dampedX,
    })} translateZ(0px)`;

    if (this.dampedX === this.x) {
      this.$services.disable('ticked');
    }
  }

  /**
   * Move instantly
   */
  moveInstantly(target) {
    this.x = target;
    this.dampedX = target;
    this.$el.style.transform = `${matrix({
      translateX: target,
    })} translateZ(0px)`;
  }

  /**
   * Check if SliderItem willbeVisible
   */
  willBeVisible(target) {
    return (
      this.rect.x + target < window.innerWidth * 1.5 &&
      this.rect.x + target + this.rect.width > window.innerWidth * -0.5
    );
  }
}
