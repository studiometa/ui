import type { BaseConfig, BaseProps, MountedReturn } from '@studiometa/js-toolkit';
import { AbstractCarouselComponent } from './AbstractCarouselComponent.js';
import { CarouselContext, type CarouselState } from './context.js';

/**
 * The shared base for the controls that must reflect the active index.
 *
 * Connecting is one awaited `$inject`, with no ordering to retry against: the
 * context protocol replays to a pending consumer when the provider mounts
 * later, and the subscription is seeded by `immediate: true`.
 */
export class AbstractCarouselChild<
  T extends BaseProps = BaseProps,
> extends AbstractCarouselComponent<T> {
  static config: BaseConfig = {
    name: 'AbstractCarouselChild',
  };

  /**
   * Declared as `MountedReturn` rather than left to inference: a subclass adds
   * a teardown of its own — a slide clearing its `inert`, for one — and the
   * inferred `Promise<Unsubscribe>` is too narrow for the array form the
   * lifecycle accepts.
   */
  mounted(): MountedReturn {
    return this.$inject(CarouselContext).then(({ state }) =>
      state.subscribe(
        (value) => {
          this.$write(() => this.update(value));
        },
        { immediate: true },
      ),
    );
  }

  /** Reflect the carousel's state. Subclasses implement it. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(state: CarouselState): void {}
}
