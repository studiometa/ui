import { Base, withIntersectionObserver } from '@studiometa/js-toolkit';
import { matrix, damp } from '@studiometa/js-toolkit/utils';

/**
 * Manage a slider item and its state transition.
 */
export default class SliderItem extends withIntersectionObserver(Base, { threshold: [0, 1] }) {
  /**
   * Config.
   */
  static config = {
    name: 'SliderItem',
    emits: ['is-fully-visible', 'is-partially-visible', 'is-hidden'],
  };

  /**
   * Wether the SliderItem is visible or not.
   * @type {Boolean}
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
   * Set SliderItem bounding rectangle on mount.
   *
   * @returns {void}
   */
  mounted() {
    this.updateRectAdjustedWithX();
  }

  /**
   * Update SliderItem bounding rectangle on resize.
   *
   * @returns {void}
   */
  resized() {
    this.updateRectAdjustedWithX();
  }

  /**
   * Reset position to `0` on destroy.
   *
   * @returns {void}
   */
  destroyed() {
    this.moveInstantly(0);
  }

  /**
   * Intersected hook.
   *
   * @param   {IntersectionObserverEntry[]} entries
   * @returns {void}
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
   * Enable the SliderItem.
   *
   * @returns {void}
   */
  activate() {
    this.$el.classList.add('is-active');
  }

  /**
   * Disable the SliderItem.
   *
   * @returns {void}
   */
  disactivate() {
    this.$el.classList.remove('is-active');
  }

  /**
   * Move the SliderItem to the given target position.
   *
   * @param   {number} targetPosition
   * @returns {void}
   */
  move(targetPosition) {
    this.x = targetPosition;

    if (!this.$services.has('ticked')) {
      this.$services.enable('ticked');
    }
  }

  /**
   * Move the SliderItem instantly to the given target position.
   *
   * @param   {number} targetPosition
   * @returns {void}
   */
  moveInstantly(targetPosition) {
    this.x = targetPosition;
    this.dampedX = targetPosition;
    this.$el.style.transform = `${matrix({
      translateX: targetPosition,
    })} translateZ(0px)`;
  }

  /**
   * Check if SliderItem is partially visible for the given target position.
   *
   * @param   {number} targetPosition
   * @returns {boolean}
   */
  willBeVisible(targetPosition) {
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
    const rect = this.$el.getBoundingClientRect().toJSON();

    this.rect = {
      ...rect,
      left: rect.left + x,
      right: rect.left + x + rect.width,
      x: rect.left + x,
    };
  }
}
