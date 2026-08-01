import { Base, type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { MAPBOX_CLUSTER_CONNECTED, type MapboxCluster } from './MapboxCluster.js';

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
 * The component is headless and passive: it never selects itself. The state
 * setters below reflect state as data-attributes on `$el` so the integrator can
 * style the item with plain CSS, and they are driven by whoever coordinates the
 * experience — a [`StoreLocator`](./StoreLocator.js) orchestrator on `moveend`
 * and on selection, if one wraps the cluster:
 *
 * - `data-in-bounds` — present when the item's `lngLat` is inside the current
 *   map viewport (list-visibility signal).
 * - `data-active` + `aria-current="true"` — present when the item is selected.
 *
 * Used under a bare `MapboxCluster` (no orchestrator) the item still registers
 * and renders as a clustered point; it just carries no selection affordance of
 * its own — a click is reported by the cluster's `item-click` event for a
 * caller to act on.
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
    emits: ['error'],
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
   * Off handler for the document-level `MAPBOX_CLUSTER_CONNECTED` retry
   * subscription, used when the item mounts before its cluster.
   * @private
   */
  __offClusterConnected?: () => void;

  /**
   * The item's stable identifier, used to match map features back to the item.
   *
   * Expected to be non-empty and unique within a cluster. Duplicate ids are not
   * rejected, but their behavior is defined rather than undefined: a click on
   * any duplicate resolves to the FIRST registered item carrying that id (see
   * `MapboxCluster.__handleUnclusteredClick`). Integrators wanting a distinct
   * selection per element must give each item a unique id.
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
   * Mounted hook: resolve the parent cluster and register with it.
   */
  mounted() {
    this.__resolveCluster();
  }

  /**
   * Resolve the parent `MapboxCluster` and register, or wait for one to connect.
   *
   * Resolution is retryable: an item eagerly registered under a lazily imported
   * cluster mounts first and finds nothing, so it waits for
   * `MAPBOX_CLUSTER_CONNECTED` and registers once its cluster is up.
   * @private
   */
  __resolveCluster() {
    const cluster = this.$closest<MapboxCluster>('MapboxCluster');

    if (!cluster) {
      this.__waitForConnectedCluster();
      return;
    }

    this.__cluster = cluster;
    cluster.register(this);
  }

  /**
   * Subscribe once to `MAPBOX_CLUSTER_CONNECTED` and retry resolution when a
   * cluster whose element is an ancestor of this item connects.
   * @private
   */
  __waitForConnectedCluster() {
    if (this.__offClusterConnected) {
      return;
    }

    const handler = (event: Event) => {
      const cluster = (event as CustomEvent<MapboxCluster>).detail;

      if (!cluster?.$el?.contains(this.$el)) {
        return;
      }

      this.__offClusterConnected?.();
      this.__offClusterConnected = undefined;
      this.__resolveCluster();
    };

    document.addEventListener(MAPBOX_CLUSTER_CONNECTED, handler);
    this.__offClusterConnected = () =>
      document.removeEventListener(MAPBOX_CLUSTER_CONNECTED, handler);
  }

  /**
   * Destroyed hook: unregister from the cached cluster, even if the element has
   * already been detached from the DOM, and drop any pending retry subscription.
   */
  destroyed() {
    try {
      this.__cluster?.unregister(this);
    } catch (err) {
      this.$warn(err);
      this.$emit('error', err);
    }

    this.__cluster = undefined;
    this.__offClusterConnected?.();
    this.__offClusterConnected = undefined;
  }

  /**
   * Reflect the "in the current map viewport" state as a `data-in-bounds`
   * attribute. Called by a `StoreLocator` orchestrator on every map `moveend`.
   * @param {boolean} value
   */
  setInBounds(value: boolean) {
    this.$el.toggleAttribute('data-in-bounds', value);
  }

  /**
   * Reflect the "selected/active" state as a `data-active` attribute and the
   * `aria-current` state. Called by a `StoreLocator` orchestrator on selection.
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
