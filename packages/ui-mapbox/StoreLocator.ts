import { Base, type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { nextTick } from '@studiometa/js-toolkit/utils';
import mapboxgl from 'mapbox-gl';
import type { Map, LngLatLike, LngLatBoundsLike, Popup } from 'mapbox-gl';
import { MapboxMap } from './MapboxMap.js';
import { MAPBOX_MAP_CONNECTED } from './AbstractMapboxMapChild.js';
import { MAPBOX_CLUSTER_CONNECTED, type MapboxCluster } from './MapboxCluster.js';
import type { MapboxClusterItem } from './MapboxClusterItem.js';
import type { MapboxGeocoder } from './MapboxGeocoder.js';

/**
 * Maximum number of `nextTick` retries used to wire the `MapboxCluster` and the
 * optional `MapboxGeocoder`. They are mounted asynchronously (the geocoder even
 * lazy-imports its module), so they may not be queryable yet on the `map-load`
 * event: we poll a few ticks before giving up.
 */
const WIRE_CHILDREN_MAX_ATTEMPTS = 10;

export interface StoreLocatorProps extends BaseProps {
  $options: {
    itemZoomLevel: number;
    noSort: boolean;
    fitOnUpdate: boolean;
    popupOptions: Record<string, unknown>;
  };
}

/**
 * Coordinate a "find a store near you" experience on top of a `MapboxMap`.
 *
 * `StoreLocator` is a thin **orchestrator**: it owns no map rendering and no item
 * registry of its own. It wraps a `MapboxMap` containing a
 * [`MapboxCluster`](./MapboxCluster.js) of
 * [`MapboxClusterItem`](./MapboxClusterItem.js)s (the declarative clustered map +
 * list source driver) plus an optional
 * [`MapboxGeocoder`](./MapboxGeocoder.js), and layers the search UX on top:
 * selection, viewport filtering and address search. The cluster keeps owning the
 * data (it derives the source from the registered items); the orchestrator only
 * reads that item set and reacts to it.
 *
 * Each store has three independent states, each with its own source of truth:
 *
 * 1. **Registered** — the item exists in the DOM. Owned by the `MapboxCluster`,
 *    it drives the **map data** and only changes when the item set changes (e.g.
 *    a `Fetch` swaps the list). The orchestrator is notified through the
 *    cluster's `update` event.
 * 2. **In bounds** — the item's `lngLat` is inside the current viewport. Drives
 *    **list visibility + distance sort only**, recomputed on map `moveend`, and
 *    never touches the map data.
 * 3. **Selected** — the chosen item. Drives fly-to, the popup, `active` styling
 *    and the `select` event.
 *
 * The orchestrator requires its `MapboxCluster` (and `MapboxMap`) to live within
 * its own subtree; it resolves them with `$query`, retries a few ticks for
 * asynchronously-mounted children, and — like the map children — subscribes to
 * the `MAPBOX_MAP_CONNECTED` / `MAPBOX_CLUSTER_CONNECTED` events so a late or
 * replaced map/cluster (re)binds instead of stranding the orchestrator on a
 * destroyed instance, and to the map's own `remove` event so a removed map is
 * never called into. Register each component independently (e.g. with
 * `registerComponent`, optionally behind a lazy `importWhen*` helper):
 * `StoreLocator`, `MapboxMap`, `MapboxCluster` and `MapboxClusterItem`.
 * Registration order does not matter because children resolve their map through
 * the connected-event retry, and the orchestrator declares no child components
 * so nothing is ever double-mounted.
 *
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class StoreLocator<T extends BaseProps = BaseProps> extends Base<T & StoreLocatorProps> {
  /**
   * Config.
   *
   * No child components are declared: `MapboxMap`, `MapboxCluster`,
   * `MapboxClusterItem` and `MapboxGeocoder` are each registered independently
   * (e.g. with `registerComponent`, optionally behind a lazy `importWhen*`
   * helper) and mount on their own. The orchestrator discovers them through
   * `$query` once available — declaring them here would double-mount them.
   */
  static config: BaseConfig = {
    name: 'StoreLocator',
    emits: ['select', 'deselect', 'filter'],
    options: {
      itemZoomLevel: {
        type: Number,
        default: 14,
      },
      // Boolean options default to `false`, so sorting is ON by default;
      // `data-option-no-sort` disables the distance sort.
      noSort: Boolean,
      // Fit the map bounds to the item set whenever it changes.
      fitOnUpdate: Boolean,
      // Options forwarded to the `mapboxgl.Popup` opened on selection.
      popupOptions: {
        type: Object,
        default: () => ({}),
      },
    },
  };

  /**
   * Whether the underlying map has finished loading.
   */
  isLoaded = false;

  /**
   * The Mapbox `Map` instance cached at load, so every listener and teardown
   * path reaches it without a fresh `$query` (which returns nothing once the
   * element is detached).
   * @private
   */
  __map?: Map;

  /**
   * The child `MapboxCluster`, cached at wire-time for detach-safe teardown.
   * @private
   */
  __cluster?: MapboxCluster;

  /**
   * The optional child `MapboxGeocoder`, cached at wire-time.
   * @private
   */
  __geocoder?: MapboxGeocoder;

  /**
   * The currently selected item, if any.
   * @private
   */
  __selected?: MapboxClusterItem;

  /**
   * The popup opened for the selected item, created lazily.
   * @private
   */
  __popup?: Popup;

  /**
   * Unsubscribe callbacks for the `MapboxCluster` listeners, flushed both on
   * destroy and when the cluster is replaced (so the orchestrator re-wires onto
   * the new instance rather than staying subscribed to the destroyed one).
   * @private
   */
  __offCluster: Array<() => void> = [];

  /**
   * Unsubscribe callbacks for the `MapboxGeocoder` listeners, flushed on destroy.
   * @private
   */
  __offGeocoder: Array<() => void> = [];

  /**
   * Off handle for the pending `map-load` subscription.
   * @private
   */
  __offMapLoad?: () => void;

  /**
   * Off handle for the ready map's own `remove` subscription, used to drop the
   * cached map the moment it is removed so no listener/teardown ever calls a
   * method on a dead map.
   * @private
   */
  __offMapRemove?: () => void;

  /**
   * Off handle for the standing document-level `MAPBOX_MAP_CONNECTED` retry
   * subscription, so a map that mounts (or a replacement that mounts after the
   * previous was removed) rebinds the orchestrator.
   * @private
   */
  __offMapConnected?: () => void;

  /**
   * Off handle for the standing document-level `MAPBOX_CLUSTER_CONNECTED` retry
   * subscription, so a cluster that mounts late — or replaces the wired one — is
   * (re)wired instead of stranding the orchestrator on a destroyed instance.
   * @private
   */
  __offClusterConnected?: () => void;

  /**
   * Whether the `MapboxCluster` listeners are already attached.
   * @private
   */
  __clusterWired = false;

  /**
   * Whether the `MapboxGeocoder` `result` listener is already attached.
   * @private
   */
  __geocoderWired = false;

  /**
   * The closest child `MapboxMap` component.
   */
  get mapboxMap() {
    const mapboxMap = this.$query<MapboxMap>('MapboxMap')[0];

    if (!mapboxMap) {
      this.$warn('Can not find a child MapboxMap component.');
    }

    return mapboxMap;
  }

  /**
   * The child `MapboxCluster`, discovered in the subtree.
   */
  get cluster(): MapboxCluster | undefined {
    return this.__cluster ?? this.$query<MapboxCluster>('MapboxCluster')[0];
  }

  /**
   * The optional child `MapboxGeocoder`, discovered in the subtree.
   */
  get geocoder(): MapboxGeocoder | undefined {
    return this.__geocoder ?? this.$query<MapboxGeocoder>('MapboxGeocoder')[0];
  }

  /**
   * The Mapbox `Map` instance. Only valid once the map has loaded.
   */
  get map() {
    return this.__map ?? this.mapboxMap?.map;
  }

  /**
   * The registered items, read from the cluster (their single source of truth).
   */
  get items(): readonly MapboxClusterItem[] {
    return this.__cluster?.items ?? [];
  }

  /**
   * Select an item: deactivate the previous one, fly to the item, open its
   * popup, mark it active and emit a `select` event.
   * @param {MapboxClusterItem} item
   */
  selectItem(item: MapboxClusterItem) {
    if (this.__selected && this.__selected !== item) {
      this.__selected.setActive(false);
    }

    item.setActive(true);
    this.__selected = item;

    this.__map?.flyTo({
      center: item.lngLat as LngLatLike,
      zoom: this.$options.itemZoomLevel,
    });

    this.__openPopup(item);
    this.$emit('select', item);
  }

  /**
   * Clear the current selection, close the popup and emit a `deselect` event.
   */
  deselect() {
    if (this.__selected) {
      this.__selected.setActive(false);
      this.__selected = undefined;
    }

    this.__popup?.remove();
    this.$emit('deselect');
  }

  /**
   * Open (or move) the selection popup on the given item, using its popup
   * content. A content-less item closes any open popup instead.
   *
   * NOTE: closing this popup through Mapbox's own close-button UI does NOT clear
   * the selection — `data-active`/`aria-current`/`__selected` stay set by design.
   * Popup visibility and selection are independent: dismissing the popup does not
   * deselect the store. Call `deselect()` explicitly to clear the selection.
   * @private
   * @param {MapboxClusterItem} item
   */
  __openPopup(item: MapboxClusterItem) {
    const map = this.__map;

    if (!map) {
      return;
    }

    const content = item.popupContent;

    if (!content) {
      this.__popup?.remove();
      return;
    }

    if (!this.__popup) {
      this.__popup = new mapboxgl.Popup(this.$options.popupOptions);
    }

    this.__popup.setLngLat(item.lngLat as LngLatLike).setHTML(content).addTo(map);
  }

  /**
   * Fit the map to the whole item set (when `fitOnUpdate`) then recompute the
   * in-view list. Runs on an item-set change (the cluster's `update` event) and
   * when the cluster is first wired.
   * @private
   */
  __refresh() {
    if (this.$options.fitOnUpdate && this.items.length > 0) {
      this.__map?.fitBounds(this.__getItemsBounds(), { padding: 40 });
    }

    this.__filterItemsInView();
  }

  /**
   * Compute the bounding box of the whole registered item set as a
   * `[[minLng, minLat], [maxLng, maxLat]]` tuple.
   * @private
   * @returns {LngLatBoundsLike}
   */
  __getItemsBounds(): LngLatBoundsLike {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const item of this.items) {
      const [lng, lat] = item.lngLat;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }

    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }

  /**
   * Recompute the visible/sorted list = registered ∩ in-bounds, distance-sorted.
   *
   * Reflects the in-bounds state on every item, reorders the in-view items in
   * their shared parent list (so DOM order matches distance) and emits `filter`
   * with the in-view items. Never touches the map data.
   * @private
   */
  __filterItemsInView() {
    const map = this.__map;

    if (!map) {
      return;
    }

    const bounds = map.getBounds();
    const center = map.getCenter();
    const inView: MapboxClusterItem[] = [];

    for (const item of this.items) {
      const isInBounds = Boolean(bounds?.contains(item.lngLat as LngLatLike));
      item.setInBounds(isInBounds);

      if (isInBounds) {
        inView.push(item);
      }
    }

    if (!this.$options.noSort && center) {
      inView.sort(
        (a, b) =>
          center.distanceTo(new mapboxgl.LngLat(a.lngLat[0], a.lngLat[1])) -
          center.distanceTo(new mapboxgl.LngLat(b.lngLat[0], b.lngLat[1])),
      );
    }

    this.__reorderList(inView);
    this.$emit('filter', inView);
  }

  /**
   * Reorder the in-view items so their DOM order matches the distance sort.
   * Appending a connected node moves it, keeping the list free of duplicates.
   * Items are reordered inside their own shared parent — the sidebar list
   * element — which is resolved per item so no `list` ref is required (a ref
   * declared on the sidebar would not bind anyway: the items live inside the
   * nested `MapboxCluster`, outside this orchestrator's ref scope).
   * @private
   * @param {MapboxClusterItem[]} items
   */
  __reorderList(items: MapboxClusterItem[]) {
    for (const item of items) {
      item.$el.parentElement?.append(item.$el);
    }
  }

  /**
   * Handle the cluster's `item-click`: select the item behind the clicked
   * unclustered point, if one was resolved.
   * @private
   */
  __handleItemClick = (event: Event) => {
    const [item] = (event as CustomEvent).detail ?? [];

    if (item) {
      this.selectItem(item as MapboxClusterItem);
    }
  };

  /**
   * Handle a click anywhere in the sidebar: resolve the nearest
   * `MapboxClusterItem` element back to its instance and select it. Delegated on
   * the root so it survives `Fetch`/facet list swaps.
   * @private
   */
  __handleListClick = (event: Event) => {
    const target = event.target as Element | null;
    const el = target?.closest?.('[data-component="MapboxClusterItem"]');

    if (!el) {
      return;
    }

    const item = this.items.find((candidate) => candidate.$el === el);

    if (item) {
      this.selectItem(item);
    }
  };

  /**
   * Handle the cluster's `update` (the item set changed): re-fit and re-filter.
   * Drops a stale selection whose item is no longer registered.
   * @private
   */
  __handleClusterUpdate = () => {
    // The selected store may have been removed by the swap. Run the full
    // deselect cleanup — not just clearing `__selected` — so its popup is
    // removed from the map and `deselect` is emitted, instead of leaving the
    // removed store's popup stranded while the locator claims nothing is
    // selected.
    if (this.__selected && !this.items.includes(this.__selected)) {
      this.deselect();
    }

    this.__refresh();
  };

  /**
   * Handle a `MapboxGeocoder` `result`: frame the map on the geocoded location.
   * @private
   */
  __handleGeocoderResult = (event: Event) => {
    const [result] = (event as CustomEvent).detail ?? [];
    const map = this.__map;

    if (!map || !result) {
      return;
    }

    if (Array.isArray(result.bbox)) {
      const [minLng, minLat, maxLng, maxLat] = result.bbox;
      map.fitBounds([
        [minLng, minLat],
        [maxLng, maxLat],
      ]);
    } else if (result.center) {
      map.flyTo({ center: result.center as LngLatLike });
    }
  };

  /**
   * Recompute the in-view list whenever the viewport settles.
   * @private
   */
  __handleMoveEnd = () => {
    this.__filterItemsInView();
  };

  /**
   * React to the map being ready: cache it, subscribe to its `remove`, bind the
   * viewport listener and wire the children.
   *
   * Idempotent for the same map (a re-entrant `map-load` or connected event does
   * not double-bind `moveend`), and rebinds cleanly onto a replacement map.
   * @private
   */
  __handleMapLoad = () => {
    const map = this.mapboxMap?.map;

    if (!map) {
      return;
    }

    // Rebinding onto a replacement: drop the viewport listener from the previous
    // map before caching and binding the new one.
    if (this.__map && this.__map !== map) {
      this.__map.off('moveend', this.__handleMoveEnd);
    }

    this.isLoaded = true;
    this.__map = map;
    this.__bindMapRemove(map);
    map.off('moveend', this.__handleMoveEnd);
    map.on('moveend', this.__handleMoveEnd);
    this.__wireChildren();
  };

  /**
   * Subscribe once to the ready map's own `remove` event so a map removed while
   * the orchestrator stays mounted drops the cached (now dead) map instead of
   * calling `flyTo`/`getBounds`/`fitBounds`/`off` on it. A replacement map
   * announces itself through `MAPBOX_MAP_CONNECTED` and rebinds the orchestrator.
   * @private
   * @param {Map} map
   */
  __bindMapRemove(map: Map) {
    this.__offMapRemove?.();
    this.__offMapRemove = undefined;

    // Degrade gracefully for minimal map doubles without an event emitter.
    if (typeof map?.on !== 'function') {
      return;
    }

    const handler = () => {
      this.__offMapRemove?.();
      this.__offMapRemove = undefined;
      this.__map?.off('moveend', this.__handleMoveEnd);
      this.__map = undefined;
      this.isLoaded = false;
    };

    map.on('remove', handler);
    this.__offMapRemove = () => map.off('remove', handler);
  }

  /**
   * Resolve the child `MapboxMap` and bind to it — now if it is already loaded,
   * otherwise once on `map-load`. When none exists yet the standing
   * `MAPBOX_MAP_CONNECTED` subscription rebinds later.
   * @private
   */
  __bindMap() {
    const { mapboxMap } = this;

    if (!mapboxMap) {
      return;
    }

    if (mapboxMap.isLoaded) {
      this.__handleMapLoad();
    } else {
      this.__offMapLoad?.();
      this.__offMapLoad = mapboxMap.$on('map-load', this.__handleMapLoad, { once: true });
    }
  }

  /**
   * Subscribe once to `MAPBOX_MAP_CONNECTED` and (re)bind when a `MapboxMap`
   * inside this orchestrator connects — a late-mounted map, or a replacement for
   * one that was removed. Ignores maps outside this subtree (several independent
   * locators/maps can share a page).
   * @private
   */
  __waitForConnectedMap() {
    if (this.__offMapConnected) {
      return;
    }

    const handler = (event: Event) => {
      const mapboxMap = (event as CustomEvent<MapboxMap>).detail;

      // The map lives *inside* the orchestrator: filter to descendants.
      if (!mapboxMap?.$el || !this.$el.contains(mapboxMap.$el)) {
        return;
      }

      // Already bound to this exact, loaded map: nothing to do.
      if (this.__map && this.__map === mapboxMap.map) {
        return;
      }

      this.__bindMap();
    };

    document.addEventListener(MAPBOX_MAP_CONNECTED, handler);
    this.__offMapConnected = () => document.removeEventListener(MAPBOX_MAP_CONNECTED, handler);
  }

  /**
   * Subscribe once to `MAPBOX_CLUSTER_CONNECTED` and (re)wire when a
   * `MapboxCluster` inside this orchestrator connects. A cluster that replaces
   * the wired one drops the stale wiring and re-wires onto the new instance, so
   * list clicks, viewport filtering and selection keep working after a swap.
   * @private
   */
  __waitForConnectedCluster() {
    if (this.__offClusterConnected) {
      return;
    }

    const handler = (event: Event) => {
      const cluster = (event as CustomEvent<MapboxCluster>).detail;

      if (!cluster?.$el || !this.$el.contains(cluster.$el)) {
        return;
      }

      if (this.__cluster && this.__cluster !== cluster) {
        // A replacement cluster: drop the stale wiring and re-wire onto it.
        this.__unwireCluster();
      }

      if (!this.__clusterWired) {
        this.__wireChildren();
      }
    };

    document.addEventListener(MAPBOX_CLUSTER_CONNECTED, handler);
    this.__offClusterConnected = () =>
      document.removeEventListener(MAPBOX_CLUSTER_CONNECTED, handler);
  }

  /**
   * Detach the current cluster listeners and reset the wiring flag so
   * `__wireChildren` binds afresh onto a replacement cluster.
   * @private
   */
  __unwireCluster() {
    for (const off of this.__offCluster) {
      off();
    }
    this.__offCluster = [];
    this.__clusterWired = false;
    this.__cluster = undefined;
  }

  /**
   * Attach the `MapboxCluster`/`MapboxGeocoder` listeners once those children
   * are available. Both mount asynchronously (the geocoder even lazy-imports its
   * module), so we poll a bounded number of ticks until *each* is wired — the
   * cluster is required, the geocoder optional. A locator missing the geocoder
   * simply polls to the attempt cap (bounded and harmless). The standing
   * connected-event subscriptions cover anything that mounts after the cap.
   * @private
   * @param {number} attempt
   */
  __wireChildren(attempt = 0) {
    const { cluster, geocoder } = this;

    // The cluster becomes queryable as soon as it is constructed, but its
    // GeoJSON source is only added from its `mounted()` hook. Observing
    // `$isMounted` guarantees the source is ready before we wire and refresh.
    if (cluster && cluster.$isMounted && !this.__clusterWired) {
      this.__clusterWired = true;
      this.__cluster = cluster;
      this.__offCluster.push(cluster.$on('item-click', this.__handleItemClick));
      this.__offCluster.push(cluster.$on('update', this.__handleClusterUpdate));
      // Catch up on the cluster's current item set: it may have emitted its
      // seeded `update` before we subscribed.
      this.__refresh();
    }

    if (geocoder && !this.__geocoderWired) {
      this.__geocoderWired = true;
      this.__geocoder = geocoder;
      this.__offGeocoder.push(geocoder.$on('result', this.__handleGeocoderResult));
    }

    if ((!this.__clusterWired || !this.__geocoderWired) && attempt < WIRE_CHILDREN_MAX_ATTEMPTS) {
      nextTick(() => {
        if (this.$isMounted) {
          this.__wireChildren(attempt + 1);
        }
      });
    }
  }

  /**
   * Mounted hook: bind the delegated sidebar click, resolve and bind the map,
   * and install the standing connected-event subscriptions so a late or replaced
   * map/cluster (re)binds instead of stranding the orchestrator.
   */
  mounted() {
    this.$el.addEventListener('click', this.__handleListClick);

    this.__bindMap();
    this.__waitForConnectedMap();
    this.__waitForConnectedCluster();
  }

  /**
   * Destroyed hook: detach every listener, close the popup and clear the cached
   * references — even when the element has already been detached from the DOM.
   */
  destroyed() {
    for (const off of this.__offCluster) {
      off();
    }
    for (const off of this.__offGeocoder) {
      off();
    }
    this.__offCluster = [];
    this.__offGeocoder = [];

    this.__offMapLoad?.();
    this.__offMapLoad = undefined;
    this.__offMapRemove?.();
    this.__offMapRemove = undefined;
    this.__offMapConnected?.();
    this.__offMapConnected = undefined;
    this.__offClusterConnected?.();
    this.__offClusterConnected = undefined;

    this.__map?.off('moveend', this.__handleMoveEnd);
    this.$el.removeEventListener('click', this.__handleListClick);

    this.__popup?.remove();
    this.__popup = undefined;
    this.__selected = undefined;
    this.__map = undefined;
    this.__cluster = undefined;
    this.__geocoder = undefined;
    this.isLoaded = false;
    this.__clusterWired = false;
    this.__geocoderWired = false;
  }
}

export default StoreLocator;
