import {
  DRAG_MODES,
  withDrag,
  type BaseConfig,
  type BaseProps,
  type DragProps,
} from '@studiometa/js-toolkit';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { getClosestIndex } from './utils.js';

/**
 * How long to wait for `scrollend` before restoring snapping anyway, in
 * milliseconds. Longer than any browser's smooth-scroll animation, since
 * restoring early would re-snap a scroll still in flight.
 */
const SNAP_RESTORE_TIMEOUT = 1000;

/** Scroll offsets closer than this are the same offset: browsers report fractions. */
const SCROLL_EPSILON = 1;

/**
 * The draggable track, on the same element as the wrapper.
 *
 * It only reads the carousel, so it extends the non-subscribing base. v3 wraps
 * it in `withMountOnMediaQuery(..., '(pointer: fine)')`; v4 spells that
 * `mountStrategy: 'media:(pointer: fine)'` — the fourth decorator in this
 * exercise that turns out to be a string in a config object.
 *
 * @link https://ui.studiometa.dev/reference/items/Carousel/js-api#carouseldrag
 */
export class CarouselDrag<T extends BaseProps = BaseProps> extends withDrag(
  AbstractCarouselComponent,
)<T> {
  static config: BaseConfig = {
    name: 'CarouselDrag',
    mountStrategy: 'media:(pointer: fine)',
  };

  /**
   * Cancels the restore armed for the settle in flight, or `null` when none is.
   * @private
   */
  __pendingRestore: (() => void) | null = null;

  /**
   * Whether this component currently owns the track's `scroll-snap-type`.
   *
   * Everything below is captured once per gesture and only while this is
   * false, so the values are the author's and never this component's own
   * `none` read back.
   * @private
   */
  __ownsSnapType = false;

  /**
   * The track's effective `scroll-snap-type` before the gesture started, which
   * is what decides whether the throw snaps.
   *
   * It cannot be read at drop time: the drag branch has written `none` by
   * then, so every gesture would look like a freescroll track. It is re-read
   * per gesture rather than cached for the component's life, so a value that
   * changes between gestures — a breakpoint, a class toggle — is picked up.
   * @private
   */
  __authorSnapType = '';

  /**
   * The track's inline `scroll-snap-type` before the gesture started, which is
   * what gets put back afterwards.
   *
   * Restoring the empty string instead would be right only for a track styled
   * from a stylesheet. On one styled inline — `style="scroll-snap-type: x
   * mandatory"` — it deletes the author's declaration, so the first drag would
   * silently turn snapping off for the life of the page.
   * @private
   */
  __inlineSnapType = '';

  dragged(props: DragProps): void {
    if (props.mode === DRAG_MODES.INERTIA || props.mode === DRAG_MODES.STOP) {
      return;
    }

    if (
      (this.isHorizontal && props.distanceX === 0) ||
      (this.isVertical && props.distanceY === 0)
    ) {
      return;
    }

    const wrapper = this.$el;

    if (props.mode === DRAG_MODES.DRAG) {
      // The first move of the gesture, and the last moment the author's own
      // values are still readable.
      if (!this.__ownsSnapType) {
        this.__ownsSnapType = true;
        this.__inlineSnapType = wrapper.style.scrollSnapType;
        this.__authorSnapType = window.getComputedStyle(wrapper).scrollSnapType;
      }

      // Scroll snapping has to come off, otherwise the track cannot be moved
      // to a position that is not a snap point.
      wrapper.style.scrollSnapType = 'none';
      wrapper.scrollTo({
        left: wrapper.scrollLeft - props.deltaX,
        top: wrapper.scrollTop - props.deltaY,
        behavior: 'instant',
      });
      return;
    }

    if (props.mode === DRAG_MODES.DROP) {
      this.__snap(wrapper, props);
    }
  }

  /**
   * Snap to the slide the throw was heading for.
   *
   * v3 projects the throw itself, from the **last event's delta** times a
   * magic `-2.5` — a per-device quantity, so the same flick threw differently
   * on a 1000 Hz mouse and a 125 Hz trackpad. The service announces its exact
   * settle position at `drop` now, so the projected scroll offset is the
   * pointer's own projected travel, mirrored.
   *
   * Every throw is ballistic: the snap closest to where the throw was heading,
   * however many slides that crosses. A hard flick travelling eight slides is
   * the intended result, not a defect — it is v1's inertia, and it is what
   * makes a long carousel usable with one gesture. A "one slide per flick"
   * clamp was tried here and dropped: it turns a throw into a step and takes
   * the momentum out of the component.
   *
   * The same branch handles a slow release, which projects barely past the
   * pointer and so lands on the slide the gesture is sitting over, and a drag
   * that barely moved, which projects onto the current slide.
   *
   * A track whose `scroll-snap-type` is `none` is not snapped at all: the
   * throw coasts to its projected position and stops wherever that is. This is
   * what `Slider`'s `fitBounds: false` was, and it is the track's declaration
   * rather than an option here, because a component that snapped a drop on a
   * track the browser does not snap would be contradicting the CSS.
   * @protected
   */
  __snap(wrapper: HTMLElement, props: DragProps): void {
    const { carousel, isHorizontal } = this;

    if (!carousel) {
      return;
    }

    const current = isHorizontal ? wrapper.scrollLeft : wrapper.scrollTop;
    // The track travels against the pointer, so the projected scroll offset is
    // the pointer's remaining projected travel, mirrored.
    const projected = isHorizontal ? props.x - props.finalX : props.y - props.finalY;

    // Freescroll: coast to the projection, snapping to nothing. `scrollTo`
    // clamps to the scroll range, so the track still cannot be thrown past its
    // own end.
    if (this.__authorSnapType === 'none') {
      this.__settle(wrapper, current + projected, current);
      return;
    }

    const offsets = carousel
      .positions()
      .map((position) => (isHorizontal ? position.left : position.top));

    // Nothing to snap to — an empty carousel. Put scroll snapping back, since
    // the drag branch took it off, rather than scrolling to `undefined`.
    if (offsets.length === 0) {
      this.__restoreSnapping(wrapper);
      return;
    }

    this.__settle(wrapper, offsets[getClosestIndex(offsets, current + projected)], current);
  }

  /**
   * Scroll to where the throw ended up, and put snapping back once it lands.
   * @private
   */
  __settle(wrapper: HTMLElement, target: number, current: number): void {
    const { isHorizontal } = this;

    // A settle that does not move fires no `scroll`, so per CSSOM View it fires
    // no `scrollend` either — which is how a drag that ended where it started
    // used to leave the track with snapping off for good. There is nothing to
    // wait for, so restore now and skip the scroll.
    if (Math.abs(target - current) < SCROLL_EPSILON) {
      this.__restoreSnapping(wrapper);
      return;
    }

    this.__restoreSnappingAfterSettle(wrapper);
    wrapper.scrollTo(
      isHorizontal ? { left: target, behavior: 'smooth' } : { top: target, behavior: 'smooth' },
    );
  }

  /**
   * Put scroll snapping back and drop whatever was armed to do it.
   * @protected
   */
  __restoreSnapping(wrapper: HTMLElement): void {
    this.__cancelRestore();

    // Nothing to put back if no gesture ever took it off — and putting the
    // captured value back regardless would write this component's idea of the
    // track onto a track it never touched.
    if (!this.__ownsSnapType) {
      return;
    }

    this.__ownsSnapType = false;
    wrapper.style.scrollSnapType = this.__inlineSnapType;
  }

  /**
   * Restore snapping once the settle scroll has finished.
   *
   * `scrollend` is the event for it and a timeout is the fallback, not
   * belt-and-braces: the event only reached Safari in 18.2, and a scroll the
   * browser interrupts — a second gesture, a `scrollTo()` from elsewhere — can
   * end without it in any engine. Whichever fires first cancels the other.
   * @protected
   */
  __restoreSnappingAfterSettle(wrapper: HTMLElement): void {
    this.__cancelRestore();

    const restore = () => this.__restoreSnapping(wrapper);
    const timer = window.setTimeout(restore, SNAP_RESTORE_TIMEOUT);
    wrapper.addEventListener('scrollend', restore, { once: true });

    this.__pendingRestore = () => {
      window.clearTimeout(timer);
      wrapper.removeEventListener('scrollend', restore);
    };
  }

  /**
   * Drop the armed restore without touching the style, so the caller decides
   * what the track ends up with. Cleared before it runs, so a restore that
   * cancels itself does not recurse.
   * @private
   */
  __cancelRestore(): void {
    const cancel = this.__pendingRestore;
    this.__pendingRestore = null;
    cancel?.();
  }

  /**
   * Leave the track snapping, whatever the gesture was doing.
   *
   * The media query this component mounts on can stop matching mid-drag, and
   * an element left with `scroll-snap-type: none` by a component that no
   * longer exists has no one to put it back.
   */
  unmounted(): void {
    super.unmounted();
    this.__restoreSnapping(this.$el);
  }
}
