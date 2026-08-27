import {
  Base,
  component,
  withRaf,
  withResize,
  withScroll,
  type BaseProps,
  type RafProps,
  type ScrollProps,
} from '@studiometa/js-toolkit';
import { clamp, damp, transform } from '@studiometa/js-toolkit/utils';

export type LargeTextProps = BaseProps & {
  $refs: {
    target: HTMLElement;
  };
  $options: {
    skew: boolean;
    sensitivity: number;
    skewSensitivity: number;
  };
};

/**
 * A marquee that continuously translates its `target` ref horizontally,
 * looping once the content has travelled its own width, to render
 * horizontally scrolling text. The motion is driven by the scroll delta and
 * tuned with `sensitivity`, with an optional `skew` effect.
 *
 * **v3's `withMountWhenInView(Base, { rootMargin: '50%' })` is the string
 * `in-view:50%`.** The decorator wrapped the constructor to build an observer,
 * keep a visibility latch and override `$mount()`; v4's registry owns the
 * observer before any instance exists, and the margin rides on the strategy
 * name. `data-mount` overrides it per element, which v3 could only do by
 * declaring a second class.
 *
 * The three v3 services are three mixins. They are the same three the class
 * always used — v3's `$services` bound `resized()`, `scrolled()` and
 * `ticked()` by their mere presence, which is why the class never named them.
 *
 * @link https://ui.studiometa.dev/reference/items/LargeText/
 */
@component({
  name: 'LargeText',
  refs: ['target'],
  mountStrategy: 'in-view:50%',
  options: {
    skew: Boolean,
    sensitivity: { type: Number, default: 1 },
    skewSensitivity: { type: Number, default: 1 },
  },
})
export class LargeText<T extends BaseProps = BaseProps> extends withRaf(
  withResize(withScroll(Base)),
)<LargeTextProps & T> {
  /** The undamped travel, in pixels, which the loop resets. */
  x = 0;

  /** The latest vertical scroll delta, which sets the travel speed. */
  deltaY = 0;

  /** The damped values written to the target each frame. */
  transform = {
    skewX: 0,
    x: 0,
  };

  /** The target's width, which is the distance one loop covers. */
  width = 0;

  /**
   * A mixin binds its subscription from `mounted()` and returns the release,
   * so a component that mixes one in **must** chain `super.mounted()`. v3's
   * `$services` sits outside the hook and forgives the omission; v4 silently
   * subscribes to nothing.
   */
  mounted() {
    this.measure();
    return super.mounted();
  }

  resized(): void {
    this.measure();
  }

  scrolled(props: ScrollProps): void {
    // v3 reads `props.delta.y`; v4's scroll service delivers a flat `deltaY`
    // alongside `directionY`.
    this.deltaY = props.deltaY;
  }

  /**
   * Advance the marquee by one frame.
   *
   * v3's `damp()` is per frame, so its result depends on the refresh rate;
   * v4's takes the elapsed milliseconds the frame service already carries, so
   * the same `0.25` factor now means the same speed on every display.
   */
  ticked({ delta }: RafProps): void {
    this.x -= (Math.abs(this.deltaY) + 1) * this.$options.sensitivity;

    this.transform.x = damp(this.x, this.transform.x, 0.25, delta);

    if (this.$options.skew) {
      this.transform.skewX = damp(
        clamp(this.deltaY * -1, -50, 50) * this.$options.skewSensitivity,
        this.transform.skewX,
        0.25,
        delta,
      );
    }

    if (this.x <= this.width * -1) {
      this.x = 0;
      this.transform.x += this.width;
    } else if (this.$options.sensitivity < 0 && this.x >= this.width) {
      this.x = 0;
      this.transform.x -= this.width;
    }

    // v3's `transform(element, props)` writes the style itself. v4's is pure —
    // it formats the string and leaves the write to the caller — so the write
    // is scheduled explicitly, into the write phase of the frame this read ran
    // in.
    this.$write(() => {
      this.$refs.target.style.transform = transform(this.transform);
    });
  }

  /** Measure the distance one loop covers. */
  measure(): void {
    this.width = this.$refs.target.clientWidth;
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/LargeText`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default LargeText;
