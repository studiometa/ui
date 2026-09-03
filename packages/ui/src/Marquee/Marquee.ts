import { Base } from '@studiometa/js-toolkit/Base';
import { withRaf } from '@studiometa/js-toolkit/withRaf';
import { withScroll } from '@studiometa/js-toolkit/withScroll';
import { usePrefersReducedMotion } from '@studiometa/js-toolkit/usePrefersReducedMotion';
import type {
  BaseConfig,
  BaseProps,
  MountedReturn,
  RafProps,
  RafRender,
  ScrollProps,
} from '@studiometa/js-toolkit';
import { damp } from '@studiometa/js-toolkit/utils/damp';
import { wrap } from '@studiometa/js-toolkit/utils/wrap';

export type MarqueeProps = BaseProps & {
  $options: {
    speed: number;
    sensitivity: number;
    damping: number;
  };
};

/** Milliseconds in a second, to read a rate per second out of a frame delta. */
const SECOND = 1000;

/**
 * A scroll-driven marquee that publishes its travel and lets CSS decide what
 * the travel means.
 *
 * It accumulates a normalised travel — one unit is one loop — from an idle
 * `speed` and from the scroll delta scaled by `sensitivity`, damps it, and
 * writes three custom properties on its own element:
 *
 * | Property | Meaning |
 * | --- | --- |
 * | `--marquee-progress` | the travel wrapped into `0…1` |
 * | `--marquee-offset` | the same travel, unwrapped and signed |
 * | `--marquee-velocity` | the damped travel rate, in loops per second, signed |
 *
 * ```css
 * .horizontal { transform: translateX(calc(var(--marquee-progress) * -100%)); }
 * .circular   { transform: rotate(calc(var(--marquee-progress) * 360deg)); }
 * .skewed     { transform: skewX(calc(var(--marquee-velocity) * 1deg)); }
 * ```
 *
 * Publishing rather than painting is what removes the measurement: `-100%`
 * **is** the content width, by definition, so there is no `clientWidth` to
 * read, nothing to re-measure on a resize and no `target` ref to read it from.
 * It is also what makes one class enough for a circular marquee as well as a
 * horizontal one — "circular" is an SVG `textPath` and a `rotate()`.
 *
 * @link https://ui.studiometa.dev/reference/items/Marquee/
 */
export class Marquee<T extends BaseProps = BaseProps> extends withRaf(withScroll(Base))<
  MarqueeProps & T
> {
  static config: BaseConfig = {
    name: 'Marquee',
    mountStrategy: 'in-view:50%',
    options: {
      speed: { type: Number, default: 0.1 },
      sensitivity: { type: Number, default: 0.001 },
      damping: { type: Number, default: 0.25 },
    },
  };

  /** The raw travel, in loops, unwrapped and unbounded. */
  offset = 0;

  /** The damped travel the element publishes. */
  dampedOffset = 0;

  /** The damped travel rate, in loops per second, signed. */
  velocity = 0;

  /** The scroll distance seen since the last frame, in pixels, signed. */
  deltaY = 0;

  /**
   * Whether the user asked for less motion, kept current for the life of the
   * component rather than sampled once.
   * @private
   */
  __prefersReducedMotion = false;

  /**
   * The last values written, so a still marquee stops writing.
   * `NaN` never equals itself, which is what makes the first frame publish.
   * @private
   */
  __publishedOffset = Number.NaN;

  /** @private */
  __publishedVelocity = Number.NaN;

  /**
   * A mixin binds its subscription from `mounted()` and returns the release,
   * so chaining `super.mounted()` is what subscribes to the frame and scroll
   * services at all.
   */
  mounted(): MountedReturn {
    const unsubscribe = usePrefersReducedMotion().subscribe(
      ({ matches }) => {
        this.__prefersReducedMotion = matches;
      },
      { immediate: true },
    );

    return [super.mounted(), unsubscribe];
  }

  /**
   * Collect the scroll distance rather than latch the last delta.
   *
   * Several scroll events can land between two frames, and the frame that
   * reads this one consumes it — so the boost is the distance actually
   * scrolled, and it returns to zero on its own when the page stops. Latching
   * the last delta instead would keep the marquee running at the speed of a
   * scroll that had long finished.
   */
  scrolled({ deltaY }: ScrollProps): void {
    this.deltaY += deltaY;
  }

  /**
   * Advance the marquee by one frame and publish the result.
   *
   * The hook runs in the frame service's **read** phase; the three custom
   * properties are a write, so they travel back as the returned render, which
   * the service runs in the write phase of the same frame.
   *
   * `damp()` takes the elapsed milliseconds, so `damping` describes the same
   * settling time on a 60 Hz and on a 120 Hz display, and `speed` the same
   * travel per second on both.
   */
  ticked({ delta }: RafProps): void | RafRender {
    const { speed, sensitivity, damping } = this.$options;
    const direction = sensitivity < 0 ? -1 : 1;
    // Continuous idle travel is decorative motion nobody asked for, so it is
    // the half that reduced motion removes. Travel driven by the scroll delta
    // is the user's own gesture, and it stops the moment they stop, so it
    // stays: suppressing it would answer "less motion" by breaking the page.
    const idle = this.__prefersReducedMotion ? 0 : (speed * delta) / SECOND;

    this.offset += direction * idle + sensitivity * Math.abs(this.deltaY);
    this.deltaY = 0;

    const previous = this.dampedOffset;
    this.dampedOffset = damp(this.offset, this.dampedOffset, damping, delta);
    // The rate falls out of what the damped follower actually moved, so the
    // published velocity is damped by construction rather than by a second
    // filter that could disagree with the position.
    this.velocity = delta > 0 ? ((this.dampedOffset - previous) * SECOND) / delta : 0;

    if (
      this.dampedOffset === this.__publishedOffset &&
      this.velocity === this.__publishedVelocity
    ) {
      return;
    }

    this.__publishedOffset = this.dampedOffset;
    this.__publishedVelocity = this.velocity;

    const { dampedOffset, velocity } = this;
    const progress = wrap(dampedOffset, 0, 1);

    return () => {
      const { style } = this.$el;
      style.setProperty('--marquee-progress', String(progress));
      style.setProperty('--marquee-offset', String(dampedOffset));
      style.setProperty('--marquee-velocity', String(velocity));
    };
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Marquee`) exposes it.
 */
export default Marquee;
