import { Base } from '@studiometa/js-toolkit/Base';
import { withPointer } from '@studiometa/js-toolkit/withPointer';
import type { BaseConfig, BaseProps, MountedReturn, PointerProps } from '@studiometa/js-toolkit';
import { smoothTo } from '@studiometa/js-toolkit/utils/smoothTo';
import type { SmoothToRecord } from '@studiometa/js-toolkit/utils';

export type CursorProps = BaseProps & {
  $options: {
    damping: number;
    states: Record<string, string>;
  };
};

/**
 * A custom cursor that follows the pointer, damping its position each frame for
 * a smooth trail, and publishes what it knows so a stylesheet can draw it.
 *
 * **It publishes three things on its own element**, the way `Carousel`
 * publishes `--carousel-progress` and `aria-current`:
 *
 * - `--cursor-x` and `--cursor-y`, the damped position in pixels;
 * - `data-cursor-state`, the name the `states` map gives to whatever the
 *   pointer is over, or the empty string;
 * - `data-cursor-down`, present while the pointer button is down.
 *
 * **The visual is not configurable, on purpose.** A scale, a colour or a
 * timing is a CSS declaration — `[data-cursor-state='grow'] { scale: 2 }` —
 * written in the author's own easing, on a compositable property, for any
 * number of states the author names. What is left for the component is the one
 * thing CSS cannot do: read the pointer.
 *
 * **The position is written as `translate`, not `transform`.** The individual
 * transform properties compose in a fixed order — `translate`, `rotate`,
 * `scale`, `transform` — with `translate` outermost, so a `scale` from a
 * stylesheet grows the cursor around the point it sits on instead of
 * multiplying the coordinates the component just wrote. Writing the position
 * into `transform` would have put it *inside* the scale, and a cursor at scale
 * 2 would have chased the pointer at twice its speed. `rotate`, `scale` and
 * `transform` are all left untouched, so a state can claim any of them.
 *
 * The component writes that translation itself rather than leaving the element
 * inert until a stylesheet reads `--cursor-x`: measured over 300 frames, a
 * custom-property write was neither faster nor slower than a transform write
 * beyond the run-to-run noise, so publishing alone buys nothing and costs the
 * out-of-the-box default.
 *
 * Only the pointer service is declared. `smoothTo()` owns the other half: two
 * named channels on one frame subscription, started when the pointer moves and
 * released the moment the cursor has caught up, so no frame is requested while
 * the cursor rests.
 *
 * @link https://ui.studiometa.dev/reference/items/Cursor/
 */
export class Cursor<T extends BaseProps = BaseProps> extends withPointer(Base)<CursorProps & T> {
  static config: BaseConfig = {
    name: 'Cursor',
    options: {
      damping: { type: Number, default: 0.25 },
      // An `Object` default is a factory, so two instances never share one map.
      states: { type: Object, default: () => ({}) },
    },
  };

  /**
   * The damped position, on one frame subscription.
   *
   * The factor is a function rather than a number because `$options` is a live
   * view over the attributes: a value captured at construction would freeze a
   * `data-option-damping` the framework keeps updating.
   */
  motion: SmoothToRecord<'x' | 'y'> = smoothTo(
    { x: 0, y: 0 },
    { damping: (): number => this.$options.damping },
  );

  /**
   * The published state name, `''` when the pointer is over nothing the map
   * names.
   *
   * **The attribute is always present.** A channel that disappears is one an
   * author has to test for existence before styling around it, and it makes
   * `[data-cursor-state]` silently select the resting cursor too. Empty is the
   * same choice `CarouselItem` makes when it writes `--carousel-item-active: 0`
   * rather than removing the property.
   */
  state = '';

  /** Whether the pointer button is down, published as `data-cursor-down`. */
  isDown = false;

  /** Selectors already reported as invalid, so one typo warns once. */
  invalidSelectors: Set<string> = new Set();

  /**
   * A mixin binds its subscription from `mounted()` and returns the release,
   * so a component that mixes one in **must** chain `super.mounted()`. Omitting
   * it subscribes to nothing, silently.
   */
  mounted(): MountedReturn {
    // A remount starts from rest: `jump()` moves the value and its target
    // together, so nothing animates back from where the last cycle left it.
    this.state = '';
    this.isDown = false;
    this.invalidSelectors.clear();
    this.render(this.motion.jump({ x: 0, y: 0 }));
    this.publish();

    return [
      super.mounted(),
      this.motion.subscribe((values: Record<'x' | 'y', number>) => this.render(values)),
      // The frame belongs to the mount cycle: a cursor unmounted mid-travel
      // must not keep asking for frames to finish a journey nobody watches.
      () => this.motion.destroy(),
    ];
  }

  /** Follow the pointer, and resolve the state it is over. */
  moved({ event, x, y, isDown }: PointerProps): void {
    this.motion({ x, y });

    // No event means the service has not observed a pointer yet, or has
    // released it: there is no target to resolve a state from, so the last
    // resolved one stands.
    const state = event ? this.resolve(event.target) : this.state;

    if (state !== this.state || isDown !== this.isDown) {
      this.state = state;
      this.isDown = isDown;
      this.publish();
    }
  }

  /**
   * The name the `states` map gives to what the pointer is over.
   *
   * `closest()`, not `matches()`: the target of a pointer event is the deepest
   * element under it, so `"a"` has to mean "over a link" and not "over the
   * link's own box but none of its children".
   *
   * Entries are tried in the order the map declares them and the first match
   * wins, so declaration order is the precedence, not proximity in the tree.
   */
  resolve(target: EventTarget | null): string {
    if (!(target instanceof Element)) {
      return '';
    }

    for (const [selector, name] of Object.entries(this.$options.states)) {
      try {
        if (target.closest(selector)) {
          return String(name);
        }
      } catch (error) {
        // One malformed selector in a JSON attribute would otherwise throw on
        // every pointer move and take the whole cursor down with it.
        if (!this.invalidSelectors.has(selector)) {
          this.invalidSelectors.add(selector);
          this.$error(
            'cursor.invalid-selector',
            `The states map has an invalid selector: "${selector}". Its state is never applied.`,
            error,
          );
        }
      }
    }

    return '';
  }

  /**
   * Publish the state and the button, as two independent attributes.
   *
   * **`data-cursor-down` is not a state.** Folding the button into the state
   * name would make a press over a growing element lose its grow, with no way
   * for an author to change that precedence. Where the pointer is and whether
   * the button is down are two facts, so they get two hooks and the cascade
   * arbitrates:
   *
   * ```css
   * [data-cursor-state='grow'] { scale: 2 }
   * [data-cursor-down] { scale: 0.8 }
   * [data-cursor-state='grow'][data-cursor-down] { scale: 1.6 }
   * ```
   *
   * It also leaves the state names entirely to the author: nothing is
   * reserved, so a map is free to call one of its states `down`.
   */
  publish(): void {
    this.$write(() => {
      this.$el.dataset.cursorState = this.state;

      if (this.isDown) {
        this.$el.dataset.cursorDown = '';
      } else {
        delete this.$el.dataset.cursorDown;
      }
    });
  }

  /**
   * A frame subscriber runs in the scheduler's **read** phase — that is where
   * `useRaf()` fans out, so that a measurement can precede the writes of the
   * same frame. This method only mutates, so it belongs in the write phase,
   * and a write scheduled from a read runs in the same frame: no latency, and
   * no style write landing between two components' measurements.
   */
  render({ x, y }: { readonly x: number; readonly y: number }): void {
    this.$write(() => {
      const { style } = this.$el;
      style.setProperty('--cursor-x', `${x}px`);
      style.setProperty('--cursor-y', `${y}px`);
      // Two values, not three: a `translate` whose z is `0` serialises back to
      // the 2D form, so the `translateZ(0)` compositing trick cannot be spelled
      // here. The hint is `will-change: translate`, which the template ships
      // and an author can drop — it is a stylesheet's decision, not a
      // component's.
      style.translate = `${x}px ${y}px`;
    });
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Cursor`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Cursor;
