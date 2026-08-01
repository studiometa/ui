import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { debounce } from '@studiometa/js-toolkit/utils';
import mapboxgl from 'mapbox-gl';
import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
  LayerSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
  GeoJSONSource,
  MapMouseEvent,
  LngLatLike,
  LngLatBoundsLike,
  Popup,
} from 'mapbox-gl';
import type { FeatureCollection, Point } from 'geojson';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import type { MapboxClusterItem } from './MapboxClusterItem.js';

/**
 * Module level counter used to generate a unique base id per instance.
 */
let clusterCount = 0;

/**
 * Generate the next unique cluster base id.
 * @returns {string}
 */
function nextClusterId(): string {
  const id = `mb-cluster-${clusterCount}`;
  clusterCount += 1;
  return id;
}

export interface MapboxClusterProps extends AbstractMapboxMapChildProps {
  $options: {
    clusterMaxZoom: number;
    clusterRadius: number;
    clusterMinPoints: number;
    clusterProperties: Record<string, unknown>;
    clustersLayout: CircleLayerSpecification['layout'];
    clustersPaint: CircleLayerSpecification['paint'];
    clusterCountLayout: SymbolLayerSpecification['layout'];
    clusterCountPaint: SymbolLayerSpecification['paint'];
    unclusteredPointLayerType: string;
    unclusteredPointLayout: Record<string, unknown>;
    unclusteredPointPaint: Record<string, unknown>;
    itemZoomLevel: number;
    noSort: boolean;
    fitOnUpdate: boolean;
    popupOptions: Record<string, unknown>;
  };
}

/**
 * A clustered GeoJSON source whose features ARE its rendered items.
 *
 * `MapboxCluster` merges the map source and the sidebar list of a classic
 * "store locator" into a single declarative unit: `MapboxClusterItem`s (rendered
 * list entries living outside the map) push themselves into the cluster's
 * registry, and the cluster derives its clustered GeoJSON source from that
 * registry. There is no separate `StoreLocator` coordinator and nothing observes
 * or `$query`s — items self-register, the cluster rebuilds (debounced) on every
 * registry change, gated on `whenMapReady`.
 *
 * Each item has three independent states:
 *
 * 1. **Registered** — the item exists in the DOM. Drives the **map data** and
 *    only changes when the item set changes (e.g. a `Fetch` swaps the list).
 * 2. **In bounds** — the item's `lngLat` is inside the current viewport. Drives
 *    **list visibility + distance sort only**, recomputed on map `moveend`.
 * 3. **Selected** — the chosen item. Drives fly-to, the popup, `active` styling
 *    and the `select` event.
 *
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxCluster<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxClusterProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxCluster',
    emits: ['cluster-click', 'feature-click', 'select', 'deselect', 'filter'],
    options: {
      clusterMaxZoom: {
        type: Number,
        default: 14,
      },
      clusterRadius: {
        type: Number,
        default: 50,
      },
      clusterMinPoints: {
        type: Number,
        default: 2,
      },
      clusterProperties: {
        type: Object,
        default: () => ({}),
      },
      clustersLayout: {
        type: Object,
        default: () => ({}),
      },
      clustersPaint: {
        type: Object,
        default: () => ({
          'circle-color': '#000',
          'circle-radius': 40,
        }),
      },
      clusterCountLayout: {
        type: Object,
        default: () => ({
          'text-field': ['get', 'point_count_abbreviated'],
        }),
      },
      clusterCountPaint: {
        type: Object,
        default: () => ({
          'text-color': 'white',
        }),
      },
      unclusteredPointLayerType: {
        type: String,
        default: 'circle',
      },
      unclusteredPointLayout: {
        type: Object,
        default: () => ({}),
      },
      unclusteredPointPaint: {
        type: Object,
        default: () => ({
          'circle-color': '#000',
          'circle-radius': 4,
        }),
      },
      // Zoom level applied when flying to a selected item.
      itemZoomLevel: {
        type: Number,
        default: 14,
      },
      // Boolean options default to `false`, so the distance sort is ON by
      // default; `data-option-no-sort` disables the reorder of in-view items.
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
   * Unique base id for this instance.
   * @private
   */
  __id = nextClusterId();

  /**
   * Live registry of the mounted `MapboxClusterItem`s, in registration order.
   * @private
   */
  __items: MapboxClusterItem[] = [];

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
   * Derive an id for the given suffix from the instance base id.
   * @private
   * @param   {string} suffix
   * @returns {string}
   */
  __getId(suffix: string): string {
    return `${this.__id}-${suffix}`;
  }

  /**
   * The GeoJSON `FeatureCollection` derived from the whole registered item set.
   *
   * This is the single source of truth pushed to the map source and only changes
   * when the item set changes — panning must never rebuild it.
   */
  get featureCollection(): FeatureCollection<Point, Record<string, unknown>> {
    return {
      type: 'FeatureCollection',
      features: this.__items.map((item) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: item.lngLat,
        },
        properties: {
          ...item.properties,
          id: item.id,
        },
      })),
    };
  }

  /**
   * Register an item and schedule a coalesced rebuild so a batch of
   * registrations (e.g. a `Fetch` list swap) results in a single map update.
   * @param {MapboxClusterItem} item
   */
  register(item: MapboxClusterItem) {
    if (!this.__items.includes(item)) {
      this.__items.push(item);
      this.__scheduleRebuild();
    }
  }

  /**
   * Unregister an item and schedule a coalesced rebuild.
   * @param {MapboxClusterItem} item
   */
  unregister(item: MapboxClusterItem) {
    const index = this.__items.indexOf(item);

    if (index > -1) {
      this.__items.splice(index, 1);

      if (this.__selected === item) {
        this.__selected = undefined;
      }

      this.__scheduleRebuild();
    }
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

    this.__readyMap?.flyTo({
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
   * Replace the live source data directly, bypassing the item registry.
   *
   * Kept for manual/imperative control; the common path is to let registered
   * items drive the data. Safe to call before mount or after teardown.
   *
   * @param {GeoJSONSourceSpecification['data']} data
   */
  setData(data: GeoJSONSourceSpecification['data']) {
    const source = this.__readyMap?.getSource<GeoJSONSource>(this.__getId('source'));

    if (source && typeof source.setData === 'function') {
      source.setData(data);
    }
  }

  /**
   * Open (or move) the selection popup on the given item, using its popup
   * content. A content-less item closes any open popup instead.
   * @private
   * @param {MapboxClusterItem} item
   */
  __openPopup(item: MapboxClusterItem) {
    const map = this.__readyMap;

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
   * Coalesce rebuilds into a single trailing call, so a batch of registrations
   * spanning multiple ticks results in one map data update.
   * @private
   */
  __scheduleRebuild = debounce(() => {
    if (this.$isMounted) {
      this.__rebuild();
    }
  }, 100);

  /**
   * Push the derived feature collection to the source, optionally fit the map to
   * the item set, then recompute the in-view list. No-op until the map is ready
   * (the initial build happens in `whenMapReady`).
   * @private
   */
  __rebuild() {
    const map = this.__readyMap;

    if (!map) {
      return;
    }

    this.setData(this.featureCollection as GeoJSONSourceSpecification['data']);

    if (this.$options.fitOnUpdate && this.__items.length > 0) {
      map.fitBounds(this.__getItemsBounds(), { padding: 40 });
    }

    this.__syncViewport();
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
   * their shared parent list (so DOM order matches distance) and emits `filter`
   * with the in-view items. Never touches the map data.
   * @private
   */
  __syncViewport() {
    const map = this.__readyMap;

    if (!map) {
      return;
    }

    const bounds = map.getBounds();
    const center = map.getCenter();
    const inView: MapboxClusterItem[] = [];

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
   * Reorder the in-view items inside their shared parent list so their DOM order
   * matches the distance sort. Appending a connected node moves it, keeping the
   * list free of duplicates.
   * @private
   * @param {MapboxClusterItem[]} items
   */
  __reorderList(items: MapboxClusterItem[]) {
    for (const item of items) {
      item.$el.parentElement?.append(item.$el);
    }
  }

  /**
   * Click handler for the clusters layer, zooming on the clicked cluster.
   * @private
   */
  __handleClustersClick = (event: MapMouseEvent) => {
    const map = this.__readyMap;

    if (!map) {
      return;
    }

    const feature = map.queryRenderedFeatures(event.point, {
      layers: [this.__getId('clusters')],
    })[0];

    if (!feature) {
      return;
    }

    const clusterId = feature.properties?.cluster_id as number;

    this.$emit('cluster-click', clusterId, event);

    if (event.defaultPrevented) {
      return;
    }

    const source = map.getSource<GeoJSONSource>(this.__getId('source'));

    source?.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || zoom === null || zoom === undefined || feature.geometry.type !== 'Point') {
        return;
      }

      map.easeTo({
        center: feature.geometry.coordinates as LngLatLike,
        zoom,
      });
    });
  };

  /**
   * Set the map canvas cursor, guarding against a missing map.
   * @private
   * @param {string} cursor
   */
  __setCursor(cursor: string) {
    const canvas = this.__readyMap?.getCanvas();

    if (canvas) {
      canvas.style.cursor = cursor;
    }
  }

  /**
   * Set a pointer cursor when entering the clusters layer.
   * @private
   */
  __handleClustersMouseenter = () => {
    this.__setCursor('pointer');
  };

  /**
   * Reset the cursor when leaving the clusters layer.
   * @private
   */
  __handleClustersMouseleave = () => {
    this.__setCursor('');
  };

  /**
   * Emit a `feature-click` for the clicked unclustered point and select the item
   * behind it.
   * @private
   */
  __handleUnclusteredClick = (event: MapMouseEvent) => {
    const feature = event.features?.[0];
    this.$emit('feature-click', feature, event);

    if (event.defaultPrevented) {
      return;
    }

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
   * Set a pointer cursor when entering an unclustered point.
   * @private
   */
  __handleUnclusteredMouseenter = () => {
    this.__setCursor('pointer');
  };

  /**
   * Reset the cursor when leaving an unclustered point.
   * @private
   */
  __handleUnclusteredMouseleave = () => {
    this.__setCursor('');
  };

  /**
   * Recompute the in-view list whenever the viewport settles.
   * @private
   */
  __handleMoveEnd = () => {
    this.__syncViewport();
  };

  /**
   * Mounted hook: build the source and layers, wire interactions, run the first
   * viewport sync — all once the map is ready.
   */
  mounted() {
    this.whenMapReady((map) => {
      const {
        clusterMaxZoom,
        clusterRadius,
        clusterMinPoints,
        clusterProperties,
        clustersLayout,
        clustersPaint,
        clusterCountLayout,
        clusterCountPaint,
        unclusteredPointLayerType,
        unclusteredPointLayout,
        unclusteredPointPaint,
      } = this.$options;

      const sourceId = this.__getId('source');
      const clustersId = this.__getId('clusters');
      const unclusteredPointId = this.__getId('unclustered-point');
      const clustersFilter = ['has', 'point_count'] as FilterSpecification;
      const unclusteredFilter = ['!', ['has', 'point_count']] as FilterSpecification;

      const source: GeoJSONSourceSpecification = {
        type: 'geojson',
        cluster: true,
        // Seed the source with the currently-registered items. Items registered
        // before the map was ready are already in `__items`, so the first render
        // is correct without waiting for a debounced rebuild.
        data: this.featureCollection,
        clusterMaxZoom,
        clusterRadius,
        clusterMinPoints,
        clusterProperties,
      };

      const clustersLayer: CircleLayerSpecification = {
        id: clustersId,
        type: 'circle',
        source: sourceId,
        filter: clustersFilter,
        layout: clustersLayout,
        paint: clustersPaint,
      };

      const clusterCountLayer: SymbolLayerSpecification = {
        id: this.__getId('cluster-count'),
        type: 'symbol',
        source: sourceId,
        filter: clustersFilter,
        layout: clusterCountLayout,
        paint: clusterCountPaint,
      };

      const unclusteredPointLayer = {
        id: unclusteredPointId,
        type: unclusteredPointLayerType,
        source: sourceId,
        filter: unclusteredFilter,
        layout: unclusteredPointLayout,
        paint: unclusteredPointPaint,
      } as unknown as LayerSpecification;

      map.addSource(sourceId, source);
      map.addLayer(clustersLayer);
      map.addLayer(clusterCountLayer);
      map.addLayer(unclusteredPointLayer);

      map.on('click', clustersId, this.__handleClustersClick);
      map.on('mouseenter', clustersId, this.__handleClustersMouseenter);
      map.on('mouseleave', clustersId, this.__handleClustersMouseleave);
      map.on('click', unclusteredPointId, this.__handleUnclusteredClick);
      map.on('mouseenter', unclusteredPointId, this.__handleUnclusteredMouseenter);
      map.on('mouseleave', unclusteredPointId, this.__handleUnclusteredMouseleave);
      map.on('moveend', this.__handleMoveEnd);

      this.__syncViewport();
    });
  }

  /**
   * Destroyed hook: tear down listeners, layers, source and popup.
   */
  destroyed() {
    const map = this.__readyMap;

    if (map) {
      const clustersId = this.__getId('clusters');
      const clusterCountId = this.__getId('cluster-count');
      const unclusteredPointId = this.__getId('unclustered-point');
      const sourceId = this.__getId('source');

      map.off('click', clustersId, this.__handleClustersClick);
      map.off('mouseenter', clustersId, this.__handleClustersMouseenter);
      map.off('mouseleave', clustersId, this.__handleClustersMouseleave);
      map.off('click', unclusteredPointId, this.__handleUnclusteredClick);
      map.off('mouseenter', unclusteredPointId, this.__handleUnclusteredMouseenter);
      map.off('mouseleave', unclusteredPointId, this.__handleUnclusteredMouseleave);
      map.off('moveend', this.__handleMoveEnd);

      for (const id of [clustersId, clusterCountId, unclusteredPointId]) {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      }

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }

    this.__popup?.remove();
    this.__popup = undefined;
    this.__items = [];
    this.__selected = undefined;

    super.destroyed();
  }
}

export default MapboxCluster;
