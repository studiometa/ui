import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseProps, BaseConfig, ChildrenCollection } from '@studiometa/js-toolkit';
import type { Map, LngLatLike, LngLatBoundsLike, Popup } from 'mapbox-gl';
import { getMapboxGl } from './dependencies.js';
import { MapboxMap } from './MapboxMap.js';
import { MAPBOX_MAP_CONNECTED } from './AbstractMapboxMapChild.js';
import type { MapboxCluster } from './MapboxCluster.js';
import type { MapboxClusterItem } from './MapboxClusterItem.js';
import type { MapboxGeocoder } from './MapboxGeocoder.js';

export interface StoreLocatorProps extends BaseProps {
  $options: {
    itemZoomLevel: number;
    noSort: boolean;
    fitOnUpdate: boolean;
    popupOptions: Record<string, unknown>;
  };
  /**
   * The orchestrator's own events, declared in the props type now that v4
   * removed the runtime `config.emits` list. Each payload is one named object
   * rather than v3's positional `detail` array.
   */
  $emits: {
    'map-select': { item: MapboxClusterItem };
    'map-deselect': void;
    'map-filter': { items: MapboxClusterItem[] };
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
 *    cluster's `map-update` event.
 * 2. **In bounds** — the item's `lngLat` is inside the current viewport. Drives
 *    **list visibility + distance sort only**, recomputed on map `moveend`, and
 *    never touches the map data.
 * 3. **Selected** — the chosen item. Drives fly-to, the popup, `active` styling
 *    and the `map-select` event.
 *
 * The orchestrator requires its `MapboxCluster` (and `MapboxMap`) to live within
 * its own subtree. It watches both with `$watchChildren()`, so a cluster or
 * geocoder that mounts late — or one that replaces the wired instance — is
 * picked up without polling; it subscribes to `MAPBOX_MAP_CONNECTED` because a
 * map announces its Mapbox instance *after* mounting, which a children
 * collection cannot report; and it subscribes to the map's own `remove` event
 * so a removed map is never called into. Register each component independently
 * with `registerComponent`: `StoreLocator`, `MapboxMap`, `MapboxCluster` and
 * `MapboxClusterItem`. Registration and mount order do not matter — v4
 * guarantees neither — and the orchestrator declares no child components so
 * nothing is ever double-mounted.
 *
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class StoreLocator<T extends BaseProps = BaseProps> extends Base<T & StoreLocatorProps> {
  /**
   * Config.
   *
   * No child components are declared: `MapboxMap`, `MapboxCluster`,
   * `MapboxClusterItem` and `MapboxGeocoder` are each registered independently
   * with `registerComponent` and mount on their own. The orchestrator discovers
   * them through `$watchChildren()` — declaring them here would double-mount
   * them, since v4 mounts a declared element through the registry either way.
   */
  static config: BaseConfig = {
    name: 'StoreLocator',
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
   * unmount and when the cluster is replaced (so the orchestrator re-wires onto
   * the new instance rather than staying subscribed to the unmounted one).
   * @private
   */
  __offCluster: Array<() => void> = [];

  /**
   * Unsubscribe callbacks for the `MapboxGeocoder` listeners, flushed on unmount.
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
   * The mounted `MapboxCluster` descendants, live and in DOM order.
   *
   * This replaces v3's bounded `nextTick` retry loop **and** the
   * `MAPBOX_CLUSTER_CONNECTED` document event the orchestrator used to listen
   * for. Both existed to answer one question v3 could not: "has the cluster
   * mounted yet?" — v4 answers it with a live collection, so a cluster that
   * mounts late, or one that replaces the wired one, is picked up by the
   * `added`/`removed` callbacks with nothing to poll. The cluster keeps
   * dispatching `MAPBOX_CLUSTER_CONNECTED` for `MapboxClusterItem`: an item
   * looks *up* for its cluster, and v4 has no watching counterpart to
   * `$closest()`.
   * @private
   */
  __clusters: ChildrenCollection<MapboxCluster> = this.$watchChildren<MapboxCluster>(
    'MapboxCluster',
    {
      added: (cluster) => this.__wireCluster(cluster),
      removed: (cluster) => {
        if (this.__cluster === cluster) {
          this.__unwireCluster();
          this.__wireCluster(this.__clusters.items[0]);
        }
      },
    },
  );

  /**
   * The mounted `MapboxGeocoder` descendants, live and in DOM order. The
   * geocoder is optional, so nothing waits for it: it wires itself whenever it
   * turns up.
   * @private
   */
  __geocoders: ChildrenCollection<MapboxGeocoder> = this.$watchChildren<MapboxGeocoder>(
    'MapboxGeocoder',
    {
      added: (geocoder) => this.__wireGeocoder(geocoder),
      removed: (geocoder) => {
        if (this.__geocoder === geocoder) {
          this.__unwireGeocoder();
          this.__wireGeocoder(this.__geocoders.items[0]);
        }
      },
    },
  );

  /**
   * The closest child `MapboxMap` component.
   */
  get mapboxMap() {
    const mapboxMap = this.$query<MapboxMap>('MapboxMap')[0];

    if (!mapboxMap) {
      this.$warn('store-locator.no-map', 'Can not find a child MapboxMap component.');
    }

    return mapboxMap;
  }

  /**
   * The child `MapboxCluster`, discovered in the subtree.
   */
  get cluster(): MapboxCluster | undefined {
    return this.__cluster ?? this.__clusters.items[0];
  }

  /**
   * The optional child `MapboxGeocoder`, discovered in the subtree.
   */
  get geocoder(): MapboxGeocoder | undefined {
    return this.__geocoder ?? this.__geocoders.items[0];
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
   * popup, mark it active and emit a `map-select` event.
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
    this.$emit('map-select', { item });
  }

  /**
   * Clear the current selection, close the popup and emit a `map-deselect` event.
   */
  deselect() {
    if (this.__selected) {
      this.__selected.setActive(false);
      this.__selected = undefined;
    }

    this.__popup?.remove();
    this.$emit('map-deselect');
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
      this.__popup = new (getMapboxGl().Popup)(this.$options.popupOptions);
    }

    this.__popup
      .setLngLat(item.lngLat as LngLatLike)
      .setHTML(content)
      .addTo(map);
  }

  /**
   * Fit the map to the whole item set (when `fitOnUpdate`) then recompute the
   * in-view list. Runs on an item-set change (the cluster's `map-update` event) and
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
   * their shared parent list (so DOM order matches distance) and emits `map-filter`
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
      const { LngLat } = getMapboxGl();
      inView.sort(
        (a, b) =>
          center.distanceTo(new LngLat(a.lngLat[0], a.lngLat[1])) -
          center.distanceTo(new LngLat(b.lngLat[0], b.lngLat[1])),
      );
    }

    this.__reorderList(inView);
    this.$emit('map-filter', { items: inView });
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
   * Handle the cluster's `map-item-click`: select the item behind the clicked
   * unclustered point, if one was resolved.
   * @private
   */
  __handleItemClick = (event: Event) => {
    const { item } = (event as CustomEvent).detail ?? {};

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
   * Handle the cluster's `map-update` (the item set changed): re-fit and re-filter.
   * Drops a stale selection whose item is no longer registered.
   * @private
   */
  __handleClusterUpdate = () => {
    // The selected store may have been removed by the swap. Run the full
    // deselect cleanup — not just clearing `__selected` — so its popup is
    // removed from the map and `map-deselect` is emitted, instead of leaving the
    // removed store's popup stranded while the locator claims nothing is
    // selected.
    if (this.__selected && !this.items.includes(this.__selected)) {
      this.deselect();
    }

    this.__refresh();
  };

  /**
   * Handle a `MapboxGeocoder` `map-result`: frame the map on the geocoded location.
   * @private
   */
  __handleGeocoderResult = (event: Event) => {
    const { result } = (event as CustomEvent).detail ?? {};
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
    this.__wireCluster(this.__clusters.items[0]);
    this.__wireGeocoder(this.__geocoders.items[0]);
    // Unconditionally, not only on a first wire: a cluster that wired before
    // the map loaded got a `__refresh()` with no map to fit or filter against,
    // and this is the first moment there is one.
    this.__refresh();
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
   * Detach the current cluster listeners so a replacement can be wired afresh.
   * @private
   */
  __unwireCluster() {
    for (const off of this.__offCluster) {
      off();
    }
    this.__offCluster = [];
    this.__cluster = undefined;
  }

  /**
   * Detach the current geocoder listener.
   * @private
   */
  __unwireGeocoder() {
    for (const off of this.__offGeocoder) {
      off();
    }
    this.__offGeocoder = [];
    this.__geocoder = undefined;
  }

  /**
   * Attach the `MapboxCluster` listeners, once, to the first cluster in the
   * subtree. A no-op while the orchestrator itself is unmounted: the collection
   * outlives a mount cycle, so `mounted()` wires whatever it already holds.
   * @private
   */
  __wireCluster(cluster?: MapboxCluster) {
    if (!cluster || this.__cluster || !this.$isMounted) {
      return;
    }

    this.__cluster = cluster;
    this.__offCluster.push(cluster.$on('map-item-click', this.__handleItemClick));
    this.__offCluster.push(cluster.$on('map-update', this.__handleClusterUpdate));
    // Catch up on the cluster's current item set: it may have emitted its
    // seeded `map-update` before we subscribed.
    this.__refresh();
  }

  /**
   * Attach the optional `MapboxGeocoder` listener, once, to the first geocoder
   * in the subtree.
   * @private
   */
  __wireGeocoder(geocoder?: MapboxGeocoder) {
    if (!geocoder || this.__geocoder || !this.$isMounted) {
      return;
    }

    this.__geocoder = geocoder;
    this.__offGeocoder.push(geocoder.$on('map-result', this.__handleGeocoderResult));
  }

  /**
   * Mounted hook: wire whatever the children collections already hold, bind the
   * delegated sidebar click, resolve and bind the map, and install the standing
   * `MAPBOX_MAP_CONNECTED` subscription so a late or replaced map rebinds
   * instead of stranding the orchestrator.
   */
  mounted() {
    this.$el.addEventListener('click', this.__handleListClick);

    // The children collections outlive a mount cycle, so a remount re-wires
    // from whatever they already hold; anything mounting later arrives through
    // their `added` callbacks.
    this.__wireCluster(this.__clusters.items[0]);
    this.__wireGeocoder(this.__geocoders.items[0]);

    this.__bindMap();
    this.__waitForConnectedMap();
  }

  /**
   * Unmounted hook: detach every listener, close the popup and clear the cached
   * references — even when the element has already been detached from the DOM.
   */
  unmounted() {
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

    this.__map?.off('moveend', this.__handleMoveEnd);
    this.$el.removeEventListener('click', this.__handleListClick);

    this.__popup?.remove();
    this.__popup = undefined;
    this.__selected = undefined;
    this.__map = undefined;
    this.__cluster = undefined;
    this.__geocoder = undefined;
    this.isLoaded = false;
  }
}

export default StoreLocator;
