import {
  DRAG_MODES,
  withDrag,
  type BaseConfig,
  type BaseProps,
  type DragProps,
} from '@studiometa/js-toolkit';
import { clamp } from '@studiometa/js-toolkit/utils';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { getClosestIndex } from './utils.js';

export type CarouselDragProps = BaseProps & {
  $options: {
    /** Let a throw travel as far as its projection says, over any number of slides. */
    skipSnaps: boolean;
  };
};

/**
 * Where a throw stops being a settle and becomes a flick, as a share of the
 * scroller and in pixels.
 *
 * The shape is Embla's: a fraction of the viewport so the same gesture means
 * the same thing on a phone and on a desktop track, bounded at both ends so a
 * tiny scroller does not fire on a twitch and a full-width one does not need a
 * throw across half the screen.
 */
const FLICK_THRESHOLD_RATIO = 0.2;
const FLICK_THRESHOLD_MIN = 50;
const FLICK_THRESHOLD_MAX = 225;

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
)<CarouselDragProps & T> {
  static config: BaseConfig = {
    name: 'CarouselDrag',
    mountStrategy: 'media:(pointer: fine)',
    options: {
      skipSnaps: Boolean,
    },
  };

  /**
   * Cancels the restore armed for the settle in flight, or `null` when none is.
   * @private
   */
  __pendingRestore: (() => void) | null = null;

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
   * That projection alone is what let a hard flick cross the whole carousel:
   * the closest snap to a settle point 900px away is eight slides on, and
   * nothing said otherwise. Two branches now share it, split at the flick
   * threshold above:
   *
   * - **Below it**, the throw is ballistic — the closest snap to where it was
   *   heading, which is the settle a slow release asks for and the branch that
   *   lands back on the current slide when the drag barely moved.
   * - **Above it**, the throw is a flick and lands on exactly one snap from
   *   where the pointer let go, in the direction it was going. `skipSnaps`
   *   opts out and keeps every throw ballistic.
   *
   * The clamp is measured from the release position rather than from the slide
   * the gesture started on: the drag itself already moved the track 1:1 with
   * the pointer, and undoing that travel to honour a "one slide per gesture"
   * rule would scroll backwards under the user's finger. One snap is the
   * ceiling on the **throw**, not on the gesture.
   *
   * Flickity pairs its own clamp with a flick-boost window, so that a fast but
   * short flick still advances. There is nothing left for it to do here: the
   * threshold is on the **projected** travel and not on the travelled distance,
   * and velocity is what drives a projection — so a flick over a few pixels
   * projects past the threshold and takes the clamped branch, which advances
   * one snap. The boost is what the clamped branch already is.
   * @protected
   */
  __snap(wrapper: HTMLElement, props: DragProps): void {
    const { carousel, isHorizontal } = this;

    if (!carousel) {
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

    const current = isHorizontal ? wrapper.scrollLeft : wrapper.scrollTop;
    // The track travels against the pointer, so the projected scroll offset is
    // the pointer's remaining projected travel, mirrored.
    const projected = isHorizontal ? props.x - props.finalX : props.y - props.finalY;
    const viewport = isHorizontal ? wrapper.clientWidth : wrapper.clientHeight;
    const threshold = clamp(
      viewport * FLICK_THRESHOLD_RATIO,
      FLICK_THRESHOLD_MIN,
      FLICK_THRESHOLD_MAX,
    );

    const index =
      this.$options.skipSnaps || Math.abs(projected) < threshold
        ? getClosestIndex(offsets, current + projected)
        : clamp(getClosestIndex(offsets, current) + Math.sign(projected), 0, offsets.length - 1);

    const target = offsets[index];

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
    wrapper.style.scrollSnapType = '';
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
