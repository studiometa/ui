import type { Base, BaseConfig } from '@studiometa/js-toolkit';

/**
 * Decorator to add wheel events to a component.
 */
export function withWheelEvents(BaseClass: typeof Base) {
  return class extends BaseClass {
    static config: BaseConfig = {
      ...BaseClass.config,
      emits: [
        'wheel-start',
        'wheel-wheel',
        'wheel-speedup',
        'wheel-top',
        'wheel-slowdown',
        'wheel-end',
      ],
    };

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
     * Store for the wheel deltas
     * @private
     */
    __deltas: number[] = [];

    /**
     * Are the delta decreasing?
     * @private
     */
    __isDecreasing = false;

    /**
     * Previous WheelEvent.
     * @private
     */
    __previousEvent: WheelEvent | null = null;

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
  };
}
