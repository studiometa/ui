import { type BaseConfig, type BaseProps, type MountedReturn } from '@studiometa/js-toolkit';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { CarouselContext } from './context.js';

export interface CarouselProgressProps {
  $refs: {
    /** The bar, translated into view as the track scrolls. */
    progress: HTMLElement;
  };
}

/**
 * The progress bar: how far through the track the carousel has scrolled.
 *
 * **Continuous, not index-derived.** v1's `SliderProgress` maps the active
 * index across the slide count, so the bar teleports one step per slide and
 * sits at zero for the whole first slide however far the track has been
 * dragged. This reads the carousel's published scroll progress instead, which
 * moves with the finger, is correct under a peek or a multi-slide layout —
 * where `index / (total - 1)` is simply a different quantity — and is the exact
 * value `animation-timeline: scroll()` takes over natively once the CSS is
 * shipped everywhere.
 *
 * **It measures nothing.** v1 reads `progress.clientWidth` on every update to
 * build a pixel translate; the offset here is a percentage of the bar's own
 * width, so there is no layout read in the hot path and the vertical axis is
 * the same expression with the components swapped. The axis is read per update
 * rather than at mount, because `axis` is a responsive option: both components
 * are always written, so a carousel that turns vertical at a breakpoint
 * unwinds the horizontal transform on its own.
 *
 * ::: tip
 * There is a no-JavaScript version of this. `Carousel` already sets
 * `--carousel-progress` on its root element and custom properties inherit, so
 * any descendant can write `transform: scaleX(var(--carousel-progress))` with
 * no component at all. Use `CarouselProgress` when you want the bar driven for
 * you, on either axis; use the custom property when you want to drive
 * something else with it.
 * :::
 *
 * The bar is decorative: it repeats the scroll position, which is not
 * information a screen reader user is missing. Give the element that holds it
 * `aria-hidden="true"`. It is not written here, because the element may hold
 * content of the author's that is not.
 *
 * @link https://ui.studiometa.dev/reference/items/Carousel/js-api#carouselprogress
 */
export class CarouselProgress<T extends BaseProps = BaseProps> extends AbstractCarouselComponent<
  CarouselProgressProps & T
> {
  static config: BaseConfig = {
    name: 'CarouselProgress',
    refs: ['progress'],
  };

  /**
   * Subscribe to the progress signal, not to the state.
   *
   * `AbstractCarouselChild` is the index-driven base and this is the one
   * control that is not index-driven, so it takes the non-subscribing base and
   * wires its own. `$inject` pends until a provider appears, so a bar mounted
   * before its carousel resolves when the carousel arrives, and one mounted
   * outside a carousel stays pending and does nothing.
   */
  mounted(): MountedReturn {
    if (!this.$refs.progress) {
      this.$warn(
        'carousel-progress.no-ref',
        'The progress bar has no `progress` ref, so it has nothing to move. Add `data-ref="progress"` to the bar.',
      );
    }

    return this.$inject(CarouselContext).then(({ progress }) =>
      progress.subscribe(
        (value) => {
          this.$write(() => this.update(value));
        },
        { immediate: true },
      ),
    );
  }

  /**
   * Slide the bar into view, from fully out at `0` to fully in at `1`.
   *
   * A translate rather than a scale, which is v1's shape and the reason it
   * needs no `transform-origin`: put the bar in a container with
   * `overflow: hidden` and it is revealed rather than stretched, so a bar with
   * a gradient, a border radius or an icon on its end keeps its proportions.
   */
  update(progress: number): void {
    const bar = this.$refs.progress;

    if (!bar) {
      return;
    }

    const offset = (progress - 1) * 100;
    const x = this.isHorizontal ? offset : 0;
    const y = this.isHorizontal ? 0 : offset;

    bar.style.transform = `translate3d(${x}%, ${y}%, 0)`;
  }
}
