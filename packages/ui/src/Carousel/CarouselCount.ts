import { type BaseConfig, type BaseProps, type MountedReturn } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import type { CarouselState } from './context.js';

export interface CarouselCountProps {
  $refs: {
    /** Receives the one-based position of the current slide. */
    current: HTMLElement;
    /** Receives the live slide count. */
    total: HTMLElement;
  };
}

/**
 * The "3 / 5" readout: the position of the current slide, and the total.
 *
 * **Both refs are optional and both are guarded.** v1's `SliderCount` writes
 * `this.$refs.current.textContent` with no check, so a markup that shows only
 * the total — or one whose `current` element has not arrived yet — throws on
 * the first state delivery and takes the mount with it. The count is the one
 * control whose whole job is to be optional decoration, so it must never be
 * the thing that breaks the carousel.
 *
 * **The numbers it writes are one-based.** `index` is a zero-based array
 * position everywhere else in the family; a person counting slides starts at
 * one.
 *
 * **No `aria-live`.** The count duplicates something the user has just done —
 * they pressed a button, or they scrolled — and a live region announcing "3 of
 * 5" over the slide the screen reader is already reading is the noise the APG's
 * own carousel guidance warns about. The slides carry their own names, which is
 * where the position is announced from.
 *
 * @link https://ui.studiometa.dev/reference/items/Carousel/js-api#carouselcount
 */
export class CarouselCount<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  CarouselCountProps & T
> {
  static config: BaseConfig = {
    name: 'CarouselCount',
    refs: ['current', 'total'],
  };

  /** Warn about the one markup mistake that makes this component do nothing. */
  mounted(): MountedReturn {
    if (!this.$refs.current && !this.$refs.total) {
      this.$warn(
        'carousel-count.no-refs',
        'The count has neither a `current` nor a `total` ref, so it has nothing to write into. Add `data-ref="current"`, `data-ref="total"`, or both.',
      );
    }

    return super.mounted();
  }

  update({ index, total }: CarouselState): void {
    const { current, total: totalRef } = this.$refs;

    if (current) {
      current.textContent = String(index + 1);
    }

    if (totalRef) {
      totalRef.textContent = String(total);
    }
  }
}
