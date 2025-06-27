import { Base, withMountOnMediaQuery } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { clamp, inertiaFinalValue } from '@studiometa/js-toolkit/utils';
import type { Slider } from './Slider.js';
import { withWheelEvents } from './utils.js';

export interface SliderWheelProps {
  $parent: Slider;
  $options: {
    fitBounds: boolean;
  };
}

/**
 * SliderWheel class.
 * The component will only mount for mouse devices and not on touch devices
 * to avoid conflict with the SliderDrag component.
 */
export class SliderWheel<T extends BaseProps = BaseProps> extends withMountOnMediaQuery(
  withWheelEvents(Base),
  '(pointer: fine)',
)<T & SliderWheelProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'SliderWheel',
    emits: [
      'wheel-start',
      'wheel-wheel',
      'wheel-speedup',
      'wheel-top',
      'wheel-slowdown',
      'wheel-end',
    ],
    options: {
      fitBounds: Boolean,
    },
  };

  /**
   * Distance to move each item.
   * @private
   */
  __distanceX = 0;

  /**
   * Get the parent Slider.
   */
  get slider() {
    return this.$parent;
  }

  onWheelStart() {
    this.$services.enable('ticked');
    this.__distanceX = this.slider.currentSliderItem ? this.slider.currentSliderItem.x : 0;
  }

  onWheelWheel({ args: [event] }) {
    const { slider } = this;
    const distance = this.__distanceX - event.deltaX;
    const clampedDistance = clamp(
      distance,
      slider.getStateValueByMode(slider.firstState.x),
      slider.getStateValueByMode(slider.lastState.x),
    );

    if (distance !== clampedDistance) {
      this.__distanceX = this.__distanceX - event.deltaX * 0.25;
    } else {
      this.__distanceX = distance;
    }
  }

  onWheelEnd({ args: [event] }) {
    this.$services.disable('ticked');
    const { slider } = this;
    let finalX = clamp(
      inertiaFinalValue(this.__distanceX, event.deltaX * -1.5),
      slider.getStateValueByMode(slider.firstState.x),
      slider.getStateValueByMode(slider.lastState.x),
    );

    const absoluteDifferencesBetweenDistanceAndState = slider.states.map((state) =>
      Math.abs(finalX - slider.getStateValueByMode(state.x)),
    );

    const minimumDifference = Math.min(...absoluteDifferencesBetweenDistanceAndState);
    const closestIndex = absoluteDifferencesBetweenDistanceAndState.indexOf(minimumDifference);

    // wether to respect fitbounds or not
    if (this.$options.fitBounds && slider.$options.fitBounds) {
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
  }

  /**
   * Move items on ticked hook.
   */
  ticked() {
    if (!this.$isMounted) return;

    const { slider } = this;
    for (const item of slider.$children.SliderItem) {
      item.moveInstantly(this.__distanceX);
    }
  }
}
