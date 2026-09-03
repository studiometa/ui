import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { CarouselContext, type CarouselApi } from './context.js';

/**
 * The shared, non-subscribing base for every Carousel child.
 *
 * The parent is resolved with one `$injectSync(CarouselContext)`, memoised for
 * the mount cycle and cleared on unmount so a move re-resolves.
 *
 * Components that only read the carousel — the wrapper and the drag track —
 * extend this directly; controls that must react to the index extend
 * `AbstractCarouselChild`.
 */
export class AbstractCarouselComponent<T extends BaseProps = BaseProps> extends Base<T> {
  static config: BaseConfig = {
    name: 'AbstractCarouselComponent',
  };

  __carousel: CarouselApi | undefined;

  /** The carousel this component belongs to, or `undefined` outside one. */
  get carousel(): CarouselApi | undefined {
    return (this.__carousel ??= this.$injectSync(CarouselContext));
  }

  /** Defaults to horizontal when there is no carousel yet. */
  get isHorizontal(): boolean {
    return this.carousel?.state.value.isHorizontal ?? true;
  }

  get isVertical(): boolean {
    return !this.isHorizontal;
  }

  unmounted(): void {
    this.__carousel = undefined;
  }
}
