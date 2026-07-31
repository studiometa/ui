import { Base, type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { debounce, nextTick } from '@studiometa/js-toolkit/utils';
import mapboxgl from 'mapbox-gl';
import type { LngLatLike, LngLatBoundsLike, GeoJSONSourceSpecification } from 'mapbox-gl';
import type { FeatureCollection, Point } from 'geojson';
import { MapboxMap } from './MapboxMap.js';
import { StoreLocatorItem } from './StoreLocatorItem.js';
import type { MapboxCluster } from './MapboxCluster.js';
import type { MapboxGeocoder } from './MapboxGeocoder.js';

/**
 * Maximum number of `nextTick` retries used to wire the optional `MapboxCluster`
 * and `MapboxGeocoder` children. They are mounted asynchronously by the
 * `MapboxMap` once its map has loaded, so they may not be queryable yet on the
 * `map-load` event: we poll a few ticks before giving up.
 */
const WIRE_CHILDREN_MAX_ATTEMPTS = 10;

export interface StoreLocatorProps extends BaseProps {
  $refs: {
    list?: HTMLElement;
  };
  $options: {
    itemZoomLevel: number;
    noSort: boolean;
    fitOnUpdate: boolean;
  };
}

/**
 * Coordinate a "find a store near you" experience around a `MapboxMap`.
 *
 * The component is a thin, composable coordinator: it owns no map rendering of
 * its own but wires together a `MapboxMap`, an optional `MapboxCluster` (the map
 * data source), an optional `MapboxGeocoder` (address search) and a list of
 * `StoreLocatorItem`s living in a sidebar.
 *
 * Each store has three independent states with different sources of truth:
 *
 * 1. **Registered** — the item exists in the DOM. Drives the **map data** and
 *    only changes when the item set changes (e.g. a `Fetch` swaps the list).
 * 2. **In bounds** — the item's `lngLat` is inside the current viewport. Drives
 *    **list visibility + distance sort only**, recomputed on map `moveend`, and
 *    never touches the map.
 * 3. **Selected** — the chosen item. Drives fly-to, `active` styling and the
 *    `select` event.
 *
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class StoreLocator<T extends BaseProps = BaseProps> extends Base<T & StoreLocatorProps> {
  /**
   * Config.
   *
   * Only `MapboxMap` and `StoreLocatorItem` are registered as components:
   *
   * - `MapboxMap` is the coordinator's direct child and must be mounted here.
   * - `StoreLocatorItem`s live in the sidebar, outside the map, so nothing else
   *   would mount them.
   *
   * `MapboxCluster` and `MapboxGeocoder` are intentionally **not** registered
   * here: they live inside the `MapboxMap` element, which already mounts them
   * lazily and safely once its map has loaded (registering them again would
   * either mount them eagerly — before the map style is ready, throwing in
   * mapbox-gl — or require faking a map-load event on this component). They are
   * instead discovered through `$query` once available.
   */
  static config: BaseConfig = {
    name: 'StoreLocator',
    refs: ['list'],
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
    },
    components: {
      MapboxMap,
      StoreLocatorItem,
    },
  };

  /**
   * Whether the underlying map has finished loading.
   */
  isLoaded = false;

  /**
   * Live registry of the mounted `StoreLocatorItem`s, in DOM order.
   * @private
   */
  __items: StoreLocatorItem[] = [];

  /**
   * The currently selected item, if any.
   * @private
   */
  __selected?: StoreLocatorItem;

  /**
   * Unsubscribe callbacks for every child/component listener attached at
   * runtime, flushed on destroy.
   * @private
   */
  __offHandlers: Array<() => void> = [];

  /**
   * Whether the `MapboxCluster` `feature-click` listener is already attached.
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
   * The optional child `MapboxCluster` component, mounted by the `MapboxMap`.
   */
  get cluster(): MapboxCluster | undefined {
    return this.$query<MapboxCluster>('MapboxCluster')[0];
  }

  /**
   * The optional child `MapboxGeocoder` component, mounted by the `MapboxMap`.
   */
  get geocoder(): MapboxGeocoder | undefined {
    return this.$query<MapboxGeocoder>('MapboxGeocoder')[0];
  }

  /**
   * The Mapbox `Map` instance. Only valid once the map has loaded.
   */
  get map() {
    return this.mapboxMap?.map;
  }

  /**
   * The GeoJSON `FeatureCollection` derived from the whole registered item set.
   *
   * This is the single source of truth pushed to the map source, and only
   * changes when the item set changes — panning must never rebuild it.
   */
  get featureCollection(): FeatureCollection<Point, { id: string }> {
    return {
      type: 'FeatureCollection',
      features: this.__items.map((item) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: item.lngLat,
        },
        properties: {
          id: item.id,
        },
      })),
    };
  }

  /**
   * Register an item and schedule a coalesced item-set sync so multiple
   * registrations from a single list swap batch into one update.
   * @param {StoreLocatorItem} item
   */
  registerItem(item: StoreLocatorItem) {
    if (!this.__items.includes(item)) {
      this.__items.push(item);
      this.__scheduleSync();
    }
  }

  /**
   * Unregister an item and schedule a coalesced item-set sync.
   * @param {StoreLocatorItem} item
   */
  unregisterItem(item: StoreLocatorItem) {
    const index = this.__items.indexOf(item);

    if (index > -1) {
      this.__items.splice(index, 1);

      if (this.__selected === item) {
        this.__selected = undefined;
      }

      this.__scheduleSync();
    }
  }

  /**
   * Select an item: deactivate the previous one, fly to the item, mark it as
   * active and emit a `select` event.
   * @param {StoreLocatorItem} item
   */
  selectItem(item: StoreLocatorItem) {
    if (this.__selected && this.__selected !== item) {
      this.__selected.setActive(false);
    }

    item.setActive(true);
    this.__selected = item;

    this.map?.flyTo({
      center: item.lngLat as LngLatLike,
      zoom: this.$options.itemZoomLevel,
    });

    this.$emit('select', item);
  }

  /**
   * Clear the current selection and emit a `deselect` event.
   */
  deselect() {
    if (this.__selected) {
      this.__selected.setActive(false);
      this.__selected = undefined;
    }

    this.$emit('deselect');
  }

  /**
   * Coalesce item-set syncs into a single trailing call, so a batch of
   * registrations (e.g. from a `Fetch` swap spanning multiple ticks) results in
   * one map data update.
   * @private
   */
  __scheduleSync = debounce(() => {
    if (this.$isMounted) {
      this.__syncItems();
    }
  }, 100);

  /**
   * Push the derived map data to the cluster, optionally fit the map to the item
   * set, then recompute the in-view list. Never runs before the map is loaded.
   * @private
   */
  __syncItems() {
    if (!this.isLoaded) {
      return;
    }

    this.cluster?.setData(this.featureCollection as GeoJSONSourceSpecification['data']);

    if (this.$options.fitOnUpdate && this.__items.length > 0) {
      this.map?.fitBounds(this.__getItemsBounds(), { padding: 40 });
    }

    this.__filterItemsInView();
  }

  /**
   * Compute the bounding box of the whole registered item set as a
   * `[[minLng, minLat], [maxLng, maxLat]]` tuple.
   * @private
   */
  __getItemsBounds(): LngLatBoundsLike {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const item of this.__items) {
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
   * the `list` ref (so DOM order matches distance) and emits `filter` with the
   * in-view items. Never touches the map.
   * @private
   */
  __filterItemsInView() {
    const { map } = this;

    if (!map) {
      return;
    }

    const bounds = map.getBounds();
    const center = map.getCenter();
    const inView: StoreLocatorItem[] = [];

    for (const item of this.__items) {
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
   * Reorder the in-view items inside the `list` ref so their DOM order matches
   * the distance sort. Appending a connected node moves it, keeping the list
   * free of duplicates.
   * @private
   * @param {StoreLocatorItem[]} items
   */
  __reorderList(items: StoreLocatorItem[]) {
    const list = this.$refs.list;

    if (!list) {
      return;
    }

    for (const item of items) {
      list.append(item.$el);
    }
  }

  /**
   * Handle a `MapboxCluster` `feature-click`: resolve the item behind the
   * clicked feature and select it.
   * @private
   */
  __handleClusterFeatureClick = (event: Event) => {
    const [feature] = (event as CustomEvent).detail ?? [];
    const id = feature?.properties?.id;

    if (id === undefined || id === null) {
      return;
    }

    const item = this.__items.find((candidate) => candidate.id === String(id));

    if (item) {
      this.selectItem(item);
    }
  };

  /**
   * Handle a `MapboxGeocoder` `result`: frame the map on the geocoded location.
   * @private
   */
  __handleGeocoderResult = (event: Event) => {
    const [result] = (event as CustomEvent).detail ?? [];
    const { map } = this;

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
   * React to the map being ready: bind map listeners, wire the optional
   * children and run the first sync.
   * @private
   */
  __handleMapLoad = () => {
    this.isLoaded = true;
    this.map?.on('moveend', this.__handleMoveEnd);
    this.__wireChildren();
    this.__syncItems();
  };

  /**
   * Attach the `MapboxCluster`/`MapboxGeocoder` listeners once those children
   * are available. They mount asynchronously after the map loads, so we retry a
   * bounded number of ticks until the (optional) cluster is wired.
   * @private
   * @param {number} attempt
   */
  __wireChildren(attempt = 0) {
    const { cluster, geocoder } = this;

    if (cluster && !this.__clusterWired) {
      this.__clusterWired = true;
      this.__offHandlers.push(cluster.$on('feature-click', this.__handleClusterFeatureClick));
      // The cluster just became available: push the current data to it.
      this.__syncItems();
    }

    if (geocoder && !this.__geocoderWired) {
      this.__geocoderWired = true;
      this.__offHandlers.push(geocoder.$on('result', this.__handleGeocoderResult));
    }

    if (!this.__clusterWired && attempt < WIRE_CHILDREN_MAX_ATTEMPTS) {
      nextTick(() => {
        if (this.$isMounted) {
          this.__wireChildren(attempt + 1);
        }
      });
    }
  }

  /**
   * Mounted hook: wait for the map to load before wiring anything.
   */
  mounted() {
    const { mapboxMap } = this;

    if (!mapboxMap) {
      return;
    }

    if (mapboxMap.isLoaded) {
      this.__handleMapLoad();
    } else {
      this.__offHandlers.push(mapboxMap.$on('map-load', this.__handleMapLoad, { once: true }));
    }
  }

  /**
   * Destroyed hook: detach every listener and clear the registry.
   */
  destroyed() {
    for (const off of this.__offHandlers) {
      off();
    }
    this.__offHandlers = [];

    this.map?.off('moveend', this.__handleMoveEnd);

    this.__items = [];
    this.__selected = undefined;
    this.isLoaded = false;
    this.__clusterWired = false;
    this.__geocoderWired = false;
  }
}
