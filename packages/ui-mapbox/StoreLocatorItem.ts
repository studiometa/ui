import { Base, type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { StoreLocator } from './StoreLocator.js';

export interface StoreLocatorItemProps extends BaseProps {
  $refs: {
    select?: HTMLElement;
  };
  $options: {
    id: string;
    lngLat: [number, number];
  };
}

/**
 * A single store entry of a `StoreLocator`.
 *
 * Unlike the other `@studiometa/ui-mapbox` components, this one does **not**
 * extend `AbstractMapboxMapChild`: its DOM lives in the sidebar list, outside
 * the `MapboxMap` element, so its context is the parent `StoreLocator`
 * coordinator — resolved via `$closest('StoreLocator')` — rather than a map.
 *
 * The component is headless: the state setters called by the coordinator only
 * reflect state as data-attributes on `$el` so the integrator can style the
 * item with plain CSS. The chosen convention is:
 *
 * - `data-in-bounds` — present when the item's `lngLat` is inside the current
 *   map viewport. This is the **list-visibility** signal; hide out-of-bounds
 *   items with `[data-component="StoreLocatorItem"]:not([data-in-bounds]) { display: none }`.
 * - `data-active` + `aria-current="true"` — present when the item is the
 *   currently selected one.
 *
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class StoreLocatorItem<T extends BaseProps = BaseProps> extends Base<
  T & StoreLocatorItemProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'StoreLocatorItem',
    refs: ['select'],
    options: {
      id: String,
      lngLat: {
        type: Array,
        default: () => [0, 0],
      },
    },
  };

  /**
   * The item's stable identifier, used to match map features back to the item.
   */
  get id(): string {
    return this.$options.id;
  }

  /**
   * The item's coordinates as a `[lng, lat]` tuple.
   */
  get lngLat(): [number, number] {
    return this.$options.lngLat;
  }

  /**
   * The closest parent `StoreLocator` coordinator instance.
   */
  get storeLocator() {
    const storeLocator = this.$closest<StoreLocator>('StoreLocator');

    if (!storeLocator) {
      this.$warn(
        'Can not find the parent store locator, does this component has a parent StoreLocator component?',
      );
    }

    return storeLocator;
  }

  /**
   * Mounted hook: register with the coordinator.
   */
  mounted() {
    this.storeLocator?.registerItem(this);
  }

  /**
   * Destroyed hook: unregister from the coordinator.
   */
  destroyed() {
    this.storeLocator?.unregisterItem(this);
  }

  /**
   * Click handler for the `select` ref, delegating the selection to the
   * coordinator so the map and the other items stay in sync.
   */
  onSelectClick() {
    this.storeLocator?.selectItem(this);
  }

  /**
   * Reflect the "in the current map viewport" state as a `data-in-bounds`
   * attribute. Called by the coordinator on every map `moveend`.
   * @param {boolean} value
   */
  setInBounds(value: boolean) {
    this.$el.toggleAttribute('data-in-bounds', value);
  }

  /**
   * Reflect the "selected/active" state as a `data-active` attribute and the
   * `aria-current` state. Called by the coordinator on selection.
   * @param {boolean} value
   */
  setActive(value: boolean) {
    this.$el.toggleAttribute('data-active', value);

    if (value) {
      this.$el.setAttribute('aria-current', 'true');
    } else {
      this.$el.removeAttribute('aria-current');
    }
  }
}
