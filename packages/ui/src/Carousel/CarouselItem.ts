import type { BaseConfig, BaseProps, MountedReturn } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import type { CarouselState } from './context.js';

/**
 * One slide.
 *
 * v3 also owns its scroll target here, as a cached `compute-scroll-into-view`
 * call invalidated from `resized()` and `updated()`. That measurement needs the
 * scroller **and** the item, and the coordinator is the only place that has
 * both, so it moved to `Carousel.positions()` — one cache instead of one per
 * slide, invalidated in one place.
 *
 * The slide's `inert` state is not here either, for the same reason: whether a
 * slide is presented is a question about the scroller, and the coordinator is
 * the only place that has one observer over the whole list.
 */
export class CarouselItem<T extends BaseProps = BaseProps> extends AbstractCarouselChild<T> {
  static config: BaseConfig = {
    name: 'CarouselItem',
  };

  /**
   * Whether the markup already names this slide.
   *
   * Read once, at mount, so a caption written by the author always wins over
   * the generated positional name — and so the generated name is not mistaken
   * for one on the next update.
   * @private
   */
  __isNamed = false;

  /** This item's position among its siblings, or `-1` outside a carousel. */
  get index(): number {
    return this.carousel?.indexOf(this.$el) ?? -1;
  }

  /**
   * Give the slide its role, and remember whether it came named.
   *
   * `role="group"` is what the APG asks for on a slide of a non-tabbed
   * carousel. No `aria-roledescription="slide"` is written, for the reason the
   * coordinator does not write `aria-roledescription="carousel"`: the string
   * is never translated, and an English word read out in a French page is
   * worse than the plain role.
   */
  mounted(): MountedReturn {
    this.__isNamed =
      this.$el.hasAttribute('aria-label') || this.$el.hasAttribute('aria-labelledby');

    if (!this.$el.hasAttribute('role')) {
      this.$el.setAttribute('role', 'group');
    }

    return [
      super.mounted(),
      () => {
        // The coordinator owns `inert` and clears it on its own teardown, but
        // a slide can also be removed while the carousel stays mounted, and a
        // detached element keeping `inert` would come back hidden if it were
        // re-inserted elsewhere.
        this.$el.inert = false;
      },
    ];
  }

  /**
   * Mirror the active index, and name the slide.
   *
   * The name is rebuilt on every update rather than written once: `total` is
   * the live slide count, so "2 of 3" has to become "2 of 4" when a slide is
   * appended. `index` is this slide's own position, not the carousel's current
   * one — the name says where the slide sits, not whether it is showing.
   */
  update({ index, total }: CarouselState): void {
    const ownIndex = this.index;
    this.$el.style.setProperty('--carousel-item-active', String(Number(ownIndex === index)));

    if (!this.__isNamed && ownIndex >= 0 && this.carousel) {
      this.$el.setAttribute('aria-label', this.carousel.slideLabel(ownIndex, total));
    }
  }
}
