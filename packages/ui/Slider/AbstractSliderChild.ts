import { Base } from '@studiometa/js-toolkit';
import type { BaseProps, BaseConfig } from '@studiometa/js-toolkit';
import { nextFrame, domScheduler, isFunction } from '@studiometa/js-toolkit/utils';
import type { Slider } from './Slider.js';

export interface AbstractSliderChildProps extends BaseProps {}

/**
 * AbstractSliderChild class.
 */
export class AbstractSliderChild<T extends BaseProps = BaseProps> extends Base<
  T & AbstractSliderChildProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'AbstractSliderChild',
  };

  /**
   * The parent Slider this child is connected to.
   * @private
   */
  __slider: Slider | undefined;

  /**
   * Unsubscribe callback for the parent Slider store subscription.
   * @private
   */
  __unsubscribe: (() => void) | null = null;

  /**
   * The parent Slider instance, if any.
   *
   * Returns the Slider that connected this child, falling back to a guarded
   * `$closest('Slider')` lookup. Child components never dereference the
   * deprecated `$parent` accessor; this may be `undefined` before the child has
   * been connected to a Slider.
   */
  get slider(): Slider | undefined {
    return this.__slider ?? this.$closest<Slider>('Slider');
  }

  /**
   * Connect to the parent Slider on mount.
   */
  mounted() {
    this.__connect();
  }

  /**
   * Reconnect and refresh with the current index on resize.
   */
  resized() {
    this.__connect();
    const { slider } = this;
    if (slider?.store.has('index')) {
      nextFrame(() => {
        this.__updateWith(slider.store.get('index', 0));
      });
    }
  }

  /**
   * Reconnect after each update as a safety net.
   */
  updated() {
    this.__connect();
  }

  /**
   * Remove the store subscription.
   */
  destroyed() {
    this.__unsubscribe?.();
    this.__unsubscribe = null;
    this.__slider = undefined;
  }

  /**
   * Subscribe to a Slider index store.
   *
   * The subscription never relies on the deprecated `$parent` accessor. The
   * Slider is either handed over by the parent itself — see `Slider.mounted`,
   * which connects the children that mounted before it — or resolved through a
   * guarded `$closest('Slider')` lookup. The call is idempotent and a no-op once
   * the child is connected or unmounted.
   *
   * The current index is pulled immediately only when the Slider has already
   * seeded its store, which happens after its geometry has been computed. This
   * ensures the `update` callback never runs against a not-yet-initialised
   * Slider (e.g. a `SliderBtn` in `contain` mode reading empty states).
   * @private
   */
  __connect(slider: Slider | undefined = this.slider) {
    if (this.__unsubscribe || !this.$isMounted || !slider) {
      return;
    }

    this.__slider = slider;
    this.__unsubscribe = slider.store.subscribe('index', (index) => {
      this.__updateWith(index ?? 0);
    });

    if (slider.store.has('index')) {
      this.__updateWith(slider.store.get('index', 0));
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
    throw new Error(`The \`AbstractSliderChild.update(${index})\` method must be implemented.`);
  }
}
