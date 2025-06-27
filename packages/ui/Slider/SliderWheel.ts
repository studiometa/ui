import { Base, withMountOnMediaQuery } from '@studiometa/js-toolkit';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { clamp, inertiaFinalValue } from '@studiometa/js-toolkit/utils';
import type { Slider } from './Slider.js';

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
  Base,
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

  __deltas: number[] = [];

  __isDecreasing = false;

  __previousEvent = null;

  /**
   * Move items on wheel.
   */
  onWheel({ event }: { event: WheelEvent }) {
    if (!this.$isMounted) return;

    if (!this.__isWheeling) {
      this.$emit('wheel-start', event);
      this.__isWheeling = true;
      this.__deltas = [];
      return;
    }

    this.__deltas.push(event.deltaX);
    const group = 5;
    const groupA = this.__deltas.slice(group * -2, group * -1).reduce((acc, val) => acc + val, 0);
    const groupB = this.__deltas.slice(group * -1).reduce((acc, val) => acc + val, 0);
    const isDecreasing = Math.abs(groupB) <= Math.abs(groupA);

    if (!this.__isDecreasing && isDecreasing) {
      this.$emit('wheel-top', this.__previousEvent);
    }

    this.$emit('wheel-wheel', event);
    this.$emit(isDecreasing ? 'wheel-slowdown' : 'wheel-speedup', event);
    this.__isDecreasing = isDecreasing;
    this.__previousEvent = event;

    window.clearTimeout(this.__timer);

    if (Math.abs(event.deltaX) > 1) return;

    this.__timer = window.setTimeout(() => {
      this.__isWheeling = false;
      this.__previousEvent = null;
      this.$emit('wheel-end', event);
    }, 64);
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
