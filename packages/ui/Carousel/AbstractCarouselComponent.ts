import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import type { Carousel } from './Carousel.js';

export interface AbstractCarouselComponentProps extends BaseProps {}

/**
 * AbstractCarouselComponent class.
 *
 * The shared, non-subscribing base for every Carousel child component. It
 * resolves the parent `Carousel` — either handed over by the Carousel on mount
 * or through a guarded `$closest('Carousel')` lookup, never via the deprecated
 * `$parent` accessor — and exposes the orientation getters the children rely on.
 *
 * It does not subscribe to the Carousel index store: components that only need
 * to read the carousel (the `CarouselWrapper` scroller and the `CarouselDrag`
 * track) extend this base directly, mirroring how `SliderItem`/`SliderDrag`
 * extend `Base` rather than `AbstractSliderChild`. Controls that must react to
 * index changes extend the subscribing `AbstractCarouselChild` instead.
 */
export class AbstractCarouselComponent<T extends BaseProps = BaseProps> extends Base<
  T & AbstractCarouselComponentProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractCarouselComponent',
  };

  /**
   * The parent Carousel this component is connected to.
   * @private
   */
  __carousel: Carousel | undefined;

  /**
   * The parent Carousel instance, if any.
   *
   * Returns the Carousel that connected this component, falling back to a
   * guarded `$closest('Carousel')` lookup. Never dereferences the deprecated
   * `$parent` accessor; may be `undefined` before the component is connected to
   * a Carousel.
   */
  get carousel(): Carousel | undefined {
    return this.__carousel ?? this.$closest<Carousel>('Carousel');
  }

  /**
   * Is the carousel horizontal? Defaults to `true` (the `x` axis) when the
   * parent Carousel cannot be resolved yet.
   */
  get isHorizontal(): boolean {
    return this.carousel?.isHorizontal ?? true;
  }

  /**
   * Is the carousel vertical? Defaults to `false` when the parent Carousel
   * cannot be resolved yet.
   */
  get isVertical(): boolean {
    return this.carousel?.isVertical ?? false;
  }
}
