import { DRAG_MODES } from '@studiometa/js-toolkit/DRAG_MODES';
import { withDrag } from '@studiometa/js-toolkit/withDrag';
import { withRaf } from '@studiometa/js-toolkit/withRaf';
import type { BaseConfig, BaseProps, DragProps, RafProps, RafRender } from '@studiometa/js-toolkit';
import { clamp } from '@studiometa/js-toolkit/utils/clamp';
import { damp } from '@studiometa/js-toolkit/utils/damp';
import { DEFAULT_DAMP_FACTOR } from '@studiometa/js-toolkit/utils/DEFAULT_DAMP_FACTOR';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { getClosestIndex } from './utils.js';

/**
 * How much of the gap to the target the settle closes per 60 Hz frame.
 *
 * `damp()` takes the fraction that moves and the drag service decays what
 * *survives*, so this is the complement of the service's own factor. Matching
 * it is the point: the service projected the throw with that decay, so
 * replaying it means the track leaves the pointer at the speed the pointer
 * had and slows on the same curve. `behavior: 'smooth'` cannot — it eases in
 * from zero, which measures as the track stopping dead for a frame and taking
 * five more to get back up to the speed the hand was already moving at.
 */
const SETTLE_FACTOR = 1 - DEFAULT_DAMP_FACTOR;

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
  withRaf(AbstractCarouselComponent, { manual: true }),
)<T> {
  static config: BaseConfig = {
    name: 'CarouselDrag',
    mountStrategy: 'media:(pointer: fine)',
  };

  /**
   * Where the settle in flight is heading, or `null` when none is.
   * @private
   */
  __settleTarget: number | null = null;

  /**
   * The settle's own position, carried between frames instead of read back
   * from the scroller.
   *
   * A scroller reports `scrollLeft` rounded, so the last frames of a decay —
   * where each step is a fraction of a pixel — would read back the position
   * they started from and the animation would stall a few pixels short of the
   * target, for ever. Keeping the exact position here means the decay always
   * progresses and lands on the target.
   * @private
   */
  __settlePosition = 0;

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
      // A hand back on the track owns the scroll again, so whatever the last
      // throw was still coasting towards is abandoned here.
      this.__stopSettle();
      this.__takeSnapType(wrapper);
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
   * Take the track's `scroll-snap-type`, remembering what was there.
   *
   * Snapping has to come off for the whole gesture *and* the settle after it:
   * a snapping track pulls every intermediate position back to the nearest
   * snap point, so a track left snapping would drag in steps and freeze an
   * animated settle at the first snap it reached.
   *
   * The values are read before the write, and only when this component does
   * not already own them, so they are the author's and never its own `none`
   * read back. The effective value decides whether the throw snaps; the inline
   * one is what gets put back.
   * @private
   */
  __takeSnapType(wrapper: HTMLElement): void {
    if (!this.__ownsSnapType) {
      this.__ownsSnapType = true;
      this.__inlineSnapType = wrapper.style.scrollSnapType;
      this.__authorSnapType = window.getComputedStyle(wrapper).scrollSnapType;
    }

    wrapper.style.scrollSnapType = 'none';
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

    // Ordinarily the drag branch already took it, but a gesture short enough
    // to drop without a single drag frame would land here first — and the
    // decision below reads the value this captures.
    this.__takeSnapType(wrapper);

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

    // A settle with nowhere to go: restore now and animate nothing.
    if (Math.abs(target - current) < SCROLL_EPSILON) {
      this.__restoreSnapping(wrapper);
      return;
    }

    // Clamped, because a freescroll throw can project past the end of the
    // track. `scrollTo` would clamp it too, but the animation compares against
    // this target to know when it has arrived — and an unreachable target is
    // one it would chase for ever.
    const distance = isHorizontal
      ? wrapper.scrollWidth - wrapper.clientWidth
      : wrapper.scrollHeight - wrapper.clientHeight;

    this.__settleTarget = clamp(target, 0, distance);
    this.__settlePosition = current;
    this.$services.ticked.start();
  }

  /**
   * Advance the settle by one frame, and put snapping back when it lands.
   *
   * Nothing is read from the DOM here — the position is this component's own —
   * so the hook is pure arithmetic and the scroll is the frame's write.
   */
  ticked({ delta }: RafProps): void | RafRender {
    const target = this.__settleTarget;

    if (target === null) {
      this.$services.ticked.stop();
      return;
    }

    const wrapper = this.$el;
    const { isHorizontal } = this;
    const next = damp(target, this.__settlePosition, SETTLE_FACTOR, delta, SCROLL_EPSILON);
    this.__settlePosition = next;

    return () => {
      wrapper.scrollTo(
        isHorizontal ? { left: next, behavior: 'instant' } : { top: next, behavior: 'instant' },
      );

      if (next === target) {
        this.__stopSettle();
        this.__restoreSnapping(wrapper);
      }
    };
  }

  /**
   * Drop the settle in flight, leaving the track wherever it got to.
   * @private
   */
  __stopSettle(): void {
    this.__settleTarget = null;
    this.$services.ticked.stop();
  }

  /**
   * Put scroll snapping back.
   * @protected
   */
  __restoreSnapping(wrapper: HTMLElement): void {
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
   * Leave the track snapping, whatever the gesture was doing.
   *
   * The media query this component mounts on can stop matching mid-drag, and
   * an element left with `scroll-snap-type: none` by a component that no
   * longer exists has no one to put it back.
   */
  unmounted(): void {
    super.unmounted();
    this.__stopSettle();
    this.__restoreSnapping(this.$el);
  }
}
