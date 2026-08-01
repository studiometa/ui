import { Base, type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { MapboxCluster } from './MapboxCluster.js';

export interface MapboxClusterItemProps extends BaseProps {
  $options: {
    id: string;
    lngLat: [number, number];
    properties: Record<string, unknown>;
  };
}

/**
 * A single entry of a `MapboxCluster`.
 *
 * Unlike the other `@studiometa/ui-mapbox` components, this one is a **rendered**
 * element (e.g. a list `<li>` in a sidebar) and does not extend
 * `AbstractMapboxMapChild`: its DOM lives outside the `MapboxMap` element, so its
 * context is the parent `MapboxCluster` — resolved via `$closest('MapboxCluster')`
 * — rather than a map.
 *
 * It is at once the list item AND the map feature: the cluster derives its
 * GeoJSON source from the set of registered items, so the same markup drives
 * both the sidebar and the clustered points on the map. The child PUSHES itself
 * to the cluster on mount (`register`) and PULLS itself out on destroy
 * (`unregister`), so the cluster never has to query for its children.
 *
 * The component is headless: state setters reflect state as data-attributes on
 * `$el` so the integrator can style the item with plain CSS:
 *
 * - `data-in-bounds` — present when the item's `lngLat` is inside the current
 *   map viewport (list-visibility signal).
 * - `data-active` + `aria-current="true"` — present when the item is selected.
 *
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxClusterItem<T extends BaseProps = BaseProps> extends Base<
  T & MapboxClusterItemProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxClusterItem',
    options: {
      id: String,
      lngLat: {
        type: Array,
        default: () => [0, 0],
      },
      properties: {
        type: Object,
        default: () => ({}),
      },
    },
  };

  /**
   * The parent `MapboxCluster` resolved at mount, cached so the item can still
   * reach it on destroy.
   *
   * `destroyed()` runs *after* the element has been detached from the DOM (e.g.
   * a `Fetch` list swap), and a `$closest` lookup on a disconnected node returns
   * nothing — which would leave the removed item registered and its feature
   * stuck on the map. Caching the reference keeps the unregister path working.
   * @private
   */
  __cluster?: MapboxCluster;

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
   * Extra feature properties merged into the item's GeoJSON feature.
   */
  get properties(): Record<string, unknown> {
    return this.$options.properties;
  }

  /**
   * The HTML used as the map popup content when this item is selected.
   *
   * Uses the inner HTML of an optional `[data-ref="popup"]` element when present
   * so the sidebar card and the map popup can differ, otherwise falls back to
   * the item's whole inner HTML.
   */
  get popupContent(): string {
    const ref = this.$el.querySelector('[data-ref="popup"]');
    return (ref ?? this.$el).innerHTML.trim();
  }

  /**
   * Mounted hook: cache the cluster and register with it.
   */
  mounted() {
    this.__cluster = this.$closest<MapboxCluster>('MapboxCluster');

    if (!this.__cluster) {
      this.$warn(
        'Can not find the parent cluster, does this component has a parent MapboxCluster component?',
      );
      return;
    }

    this.__cluster.register(this);
  }

  /**
   * Destroyed hook: unregister from the cached cluster, even if the element has
   * already been detached from the DOM.
   */
  destroyed() {
    this.__cluster?.unregister(this);
    this.__cluster = undefined;
  }

  /**
   * Click handler delegating the selection to the cluster so the map and the
   * other items stay in sync. Auto-bound by js-toolkit to a click on `$el`.
   */
  onClick() {
    this.__cluster?.selectItem(this);
  }

  /**
   * Reflect the "in the current map viewport" state as a `data-in-bounds`
   * attribute. Called by the cluster on every map `moveend`.
   * @param {boolean} value
   */
  setInBounds(value: boolean) {
    this.$el.toggleAttribute('data-in-bounds', value);
  }

  /**
   * Reflect the "selected/active" state as a `data-active` attribute and the
   * `aria-current` state. Called by the cluster on selection.
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

export default MapboxClusterItem;
