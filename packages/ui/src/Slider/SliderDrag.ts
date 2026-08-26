import {
  Base,
  DRAG_MODES,
  withDrag,
  type DragProps,
  type MountedReturn,
} from '@studiometa/js-toolkit';

export interface SliderDragProps {
  $emits: {
    start: DragProps;
    drag: DragProps;
    drop: DragProps;
    inertia: DragProps;
    stop: DragProps;
  };
}

/**
 * Optional draggable track that emits the drag lifecycle to its Slider.
 *
 * @link https://ui.studiometa.dev/reference/items/Slider/
 */
export class SliderDrag extends withDrag(Base)<SliderDragProps> {
  static config = { name: 'SliderDrag' };

  /**
   * Inline `touch-action` to put back, when this component set it.
   * @private
   */
  __previousTouchAction: string | null = null;

  /**
   * Preserve vertical page gestures. Set `touch-action` before the drag service
   * subscribes because it reads the computed value once.
   */
  mounted(): MountedReturn {
    if (getComputedStyle(this.$el).touchAction === 'auto') {
      this.__previousTouchAction = this.$el.style.touchAction;
      this.$el.style.touchAction = 'pan-y';
    }

    return [
      super.mounted(),
      () => {
        if (this.__previousTouchAction !== null) {
          this.$el.style.touchAction = this.__previousTouchAction;
          this.__previousTouchAction = null;
        }
      },
    ];
  }

  /** Re-emit non-idle drag modes. Copy props before retaining them asynchronously. */
  dragged(props: DragProps): void {
    if (props.mode === DRAG_MODES.IDLE) {
      return;
    }
    this.$emit(props.mode, props);
  }
}
