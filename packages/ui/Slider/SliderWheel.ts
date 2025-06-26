import { Base, withMountOnMediaQuery } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { clamp, inertiaFinalValue } from '@studiometa/js-toolkit/utils';
import type { Slider } from './Slider.js';

export interface SliderWheelProps {
  $parent: Slider;
}
/**
 * SliderWheel class.
 * The component will only mount for mouse devices and not on touch devices
 * to avoid conflict with the SliderDrag component.
 */
export class SliderWheel<T extends BaseProps = BaseProps> extends withMountOnMediaQuery(
  Base,
  '(pointer: fine)',
)<T & SliderWheelProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderWheel',
  };

  /**
   * Get the parent Slider.
   */
  get slider() {
    return this.$parent;
  }

  /**
   * Are we currently wheeling?
   * @private
   */
  __isWheeling = false;

  /**
   * Timer to detect wheel end.
   * @private
   */
  __timer = -1;

  /**
   * Distance to move each item.
   * @private
   */
  __distanceX = 0;

  /**
   * Move items on wheel.
   */
  onWheel({ event }: { event: WheelEvent }) {
    if (!this.$isMounted) return;

    const { slider } = this;

    if (!this.__isWheeling) {
      this.$services.enable('ticked');
      this.__isWheeling = true;
      this.__distanceX = slider.currentSliderItem ? slider.currentSliderItem.x : 0;
      return;
    }


    this.__distanceX = this.__distanceX - event.deltaX;

    window.clearTimeout(this.__timer);
    this.__timer = window.setTimeout(() => {
      let finalX = clamp(
        inertiaFinalValue(this.__distanceX, event.deltaX * -slider.$options.dropSensitivity),
        slider.getStateValueByMode(slider.firstState.x),
        slider.getStateValueByMode(slider.lastState.x),
      );

      const absoluteDifferencesBetweenDistanceAndState = slider.states.map((state) =>
        Math.abs(finalX - slider.getStateValueByMode(state.x)),
      );

      const minimumDifference = Math.min(...absoluteDifferencesBetweenDistanceAndState);
      const closestIndex = absoluteDifferencesBetweenDistanceAndState.indexOf(minimumDifference);

      // wether to respect fitbounds or not
      if (slider.$options.fitBounds) {
        slider.goTo(closestIndex);
      } else {
        if (slider.$options.contain) {
          finalX = Math.min(slider.containMinState, finalX);
          finalX = Math.max(slider.containMaxState, finalX);
        }
        for (const item of slider.$children.SliderItem) {
          item.move(finalX);
        }
        slider.currentIndex = closestIndex;
      }

      this.__isWheeling = false;
    }, 64);
  }

  /**
   * Move items on ticked hook.
   */
  ticked() {
    if (!this.$isMounted) return;

    if (this.__isWheeling) {
      const { slider } = this;
      for (const item of slider.$children.SliderItem) {
        item.moveInstantly(this.__distanceX);
      }
    } else {
      this.$services.disable('ticked');
    }
  }
}
