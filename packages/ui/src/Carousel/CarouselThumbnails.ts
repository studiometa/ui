import type { BaseConfig, BaseProps, MountedReturn, RefEvent } from '@studiometa/js-toolkit';
import { AbstractCarouselChild } from './AbstractCarouselChild.js';
import type { CarouselState } from './context.js';
import { hasAccessibleName } from './utils.js';

export interface CarouselThumbnailsProps {
  $refs: {
    /** One `<button>` per slide, in slide order, each showing that slide. */
    thumbs: HTMLButtonElement[];
  };
}

/**
 * The thumbnail picker: a `<button>` showing each slide, marking the one open.
 *
 * **The control the evidence asked for.** In the only large public dataset of
 * carousel interaction it is the measured winner — 55% of visitors use the
 * thumbnails, more than the arrows and the swipe gesture put together — and it
 * is the fix for the separate finding that 50% of desktop users could not find
 * a product's additional images when the carousel showed indicators alone. A
 * dot says how many slides there are; a thumbnail says what is on them, which
 * is the question a visitor is actually asking.
 *
 * **The semantics are the dots' semantics**, for the dots' reasons: plain
 * `<button>` elements, no `tablist`/`tab` roles, `aria-current="true"` on the
 * open one and never `disabled` — a `disabled` control drops out of the
 * accessibility tree, so the picker would lose an entry every time the carousel
 * moved.
 *
 * **Naming is where it differs from the dots**, and it is the part worth
 * getting right. A thumbnail is `<button><img alt="…"></button>`: the image's
 * `alt` already *is* the button's accessible name, and it is a far better name
 * than a position, so it is left alone. The positional fallback — the
 * carousel's own `slide-label` — is written only when the button would
 * otherwise be nameless, which is the `alt=""` decorative-image case an author
 * reaches for without realising the button goes with it.
 *
 * ::: tip
 * Give each thumbnail image a real `alt`. "3 of 5" tells a screen reader user
 * how many slides there are; "Red dress, back view" tells them which one this
 * button opens, which is the whole reason the control exists.
 * :::
 *
 * @link https://ui.studiometa.dev/reference/items/Carousel/js-api#carouselthumbnails
 */
export class CarouselThumbnails<T extends BaseProps = BaseProps> extends AbstractCarouselChild<
  CarouselThumbnailsProps & T
> {
  static config: BaseConfig = {
    name: 'CarouselThumbnails',
    refs: ['thumbs[]'],
  };

  /**
   * The thumbnails this component named, so the teardown gives back exactly
   * what it took and a re-name never mistakes a generated name for the
   * author's.
   * @private
   */
  __owned = new WeakSet<HTMLElement>();

  mounted(): MountedReturn {
    return [
      super.mounted(),
      () => {
        for (const thumb of this.$refs.thumbs) {
          thumb.removeAttribute('aria-current');

          if (this.__owned.has(thumb)) {
            thumb.removeAttribute('aria-label');
            this.__owned.delete(thumb);
          }
        }
      },
    ];
  }

  /**
   * Mark the open thumbnail and name every nameless one.
   *
   * The naming pass runs on every update, not once at mount: `total` is the
   * live slide count, so appending a slide rewrites the fallback name of every
   * thumbnail that has one.
   */
  update({ index, total }: CarouselState): void {
    const { carousel } = this;

    for (const [position, thumb] of this.$refs.thumbs.entries()) {
      if (position === index) {
        thumb.setAttribute('aria-current', 'true');
      } else {
        thumb.removeAttribute('aria-current');
      }

      if (carousel && (this.__owned.has(thumb) || !hasAccessibleName(thumb))) {
        thumb.setAttribute('aria-label', carousel.slideLabel(position, total));
        this.__owned.add(thumb);
      }
    }
  }

  /**
   * Open the slide the thumbnail shows.
   *
   * Resolved through the context on the event path, so a picker outside a
   * carousel is inert rather than throwing.
   */
  onThumbsClick({ index }: RefEvent<HTMLButtonElement>): void {
    this.carousel?.goTo(index);
  }
}
