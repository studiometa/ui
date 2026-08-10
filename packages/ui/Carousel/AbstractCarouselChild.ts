import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { nextFrame } from '@studiometa/js-toolkit/utils/nextFrame';
import { domScheduler } from '@studiometa/js-toolkit/utils/domScheduler';
import { isFunction } from '@studiometa/js-toolkit/utils/isFunction';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import type { Carousel } from './Carousel.js';

export interface AbstractCarouselChildProps extends BaseProps {}

/**
 * AbstractCarouselChild class.
 *
 * The shared base for Carousel controls that must reflect the active index
 * (items, buttons). It connects to its parent `Carousel` — either handed over
 * by the Carousel on mount or resolved through the inherited guarded
 * `$closest('Carousel')` lookup, never via the deprecated `$parent` accessor —
 * and subscribes to the Carousel's index store, scheduling a call to the
 * subclass `update(index)` method whenever the active item changes. Subclasses
 * must implement `update` to reflect the current index in the DOM.
 */
export class AbstractCarouselChild<T extends BaseProps = BaseProps> extends AbstractCarouselComponent<
  T & AbstractCarouselChildProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractCarouselChild',
  };

  /**
   * Unsubscribe callback for the parent Carousel store subscription.
   * @private
   */
  __unsubscribe: (() => void) | null = null;

  /**
   * Connect to the parent Carousel on mount.
   */
  mounted() {
    this.__connect();
  }

  /**
   * Reconnect and refresh with the current index on resize.
   */
  resized() {
    this.__connect();
    const { carousel } = this;
    if (carousel?.store.has('index')) {
      nextFrame(() => {
        this.__updateWith(carousel.store.get('index', 0));
      });
    }
  }

  /**
   * Reconnect and refresh on update.
   *
   * Reconnects (idempotent) then re-runs the subclass `update` against the
   * current index. This matters when items are added or removed after mount:
   * the index *value* may be unchanged — so the store's change-gated `set` does
   * not re-notify — yet `carousel.lastIndex` and an item's own position among
   * its siblings have shifted. Without this refresh a `CarouselBtn` could stay
   * stuck disabled (e.g. `next` after appending items) or a `CarouselItem` keep
   * a stale active state.
   */
  updated() {
    this.__connect();
    const { carousel } = this;
    if (carousel?.store.has('index')) {
      this.__updateWith(carousel.store.get('index', 0));
    }
  }

  /**
   * Remove the store subscription.
   */
  destroyed() {
    this.__unsubscribe?.();
    this.__unsubscribe = null;
    this.__carousel = undefined;
  }

  /**
   * Subscribe to a Carousel index store.
   *
   * The subscription never relies on the deprecated `$parent` accessor. The
   * Carousel is either handed over by the parent itself — see
   * `Carousel.connectChildren`, which connects the children that mounted before
   * it — or resolved through a guarded `$closest('Carousel')` lookup. The call
   * is idempotent and a no-op once the child is connected or unmounted.
   *
   * The current index is pulled immediately only when the Carousel has already
   * seeded its store, which happens after `Carousel.mounted` runs its initial
   * `goTo`. This ensures the `update` callback never runs against a
   * not-yet-initialised Carousel and fixes the initial-state race where the
   * first item was not marked active and the `prev` button was not disabled on
   * load.
   * @private
   */
  __connect(carousel: Carousel | undefined = this.carousel) {
    if (this.__unsubscribe || !this.$isMounted || !carousel) {
      return;
    }

    this.__carousel = carousel;
    this.__unsubscribe = carousel.store.subscribe('index', (index) => {
      this.__updateWith(index ?? 0);
    });

    if (carousel.store.has('index')) {
      this.__updateWith(carousel.store.get('index', 0));
    }
  }

  /**
   * Schedule the `update` callback for the given index.
   * @private
   */
  __updateWith(index: number) {
    domScheduler.read(() => {
      const callback = this.update(index);
      if (isFunction(callback)) {
        domScheduler.write(() => {
          // @ts-ignore
          callback();
        });
      }
    });
  }

  /**
   * Update the child component with the given index.
   */
  update(index: number): void | (() => void) {
    throw new Error(`The \`AbstractCarouselChild.update(${index})\` method must be implemented.`);
  }
}
