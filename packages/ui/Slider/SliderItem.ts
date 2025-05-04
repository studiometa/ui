import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { damp, domScheduler, transform } from '@studiometa/js-toolkit/utils';

export interface SliderItemProps extends BaseProps {}

/**
 * SliderItem class.
 */
export class SliderItem<T extends BaseProps = BaseProps> extends Base<T & SliderItemProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderItem',
  };

  /**
   * The SliderItem `x` position.
   */
  x = 0;

  /**
   * The smoothed `x` position.
   */
  dampedX = 0;

  /**
   * Item original position.
   */
  __rect: {
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
   * Wether the slider item size should be evaluated or not.
   */
  shouldEvaluateRect = false;

  /**
   * Size of the slider item.
   */
  get rect() {
    if (!this.__rect || this.shouldEvaluateRect) {
      this.shouldEvaluateRect = false;
      const x = this.x * -1;
      const rect = this.$el.getBoundingClientRect().toJSON();
      this.__rect = {
        ...rect,
        left: rect.left + x,
        right: rect.left + x + rect.width,
        x: rect.left + x,
      };
    }

    return this.__rect;
  }

  /**
   * Mounted hook
   */
  mounted() {
    this.setAccessibilityAttributes();
  }

  /**
   * Update SliderItem bounding rectangle on resize.
   */
  resized() {
    this.shouldEvaluateRect = true;
  }

  /**
   * Reset position to `0` on destroy.
   */
  destroyed() {
    this.moveInstantly(0);
  }

  /**
   * Ticked hook.
   * @todo create AbstractSliderItem with `render` method
   * @todo add state to SliderItem
   * @todo add origin to SliderItem
   */
  ticked() {
    this.dampedX = damp(this.x, this.dampedX, 0.1, 0.00001);
    this.render();

    if (this.dampedX === this.x) {
      this.$services.disable('ticked');
    }
  }

  /**
   * Set accessibility attributes for the component
   */
  setAccessibilityAttributes() {
    this.$el.setAttribute('role', 'group');
    this.$el.setAttribute('aria-roledescription', 'slide');
    this.$el.setAttribute('aria-label', this.$id);
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
}
