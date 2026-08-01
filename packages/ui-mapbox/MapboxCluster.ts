import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { debounce } from '@studiometa/js-toolkit/utils';
import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
  LayerSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
  GeoJSONSource,
  MapMouseEvent,
  LngLatLike,
} from 'mapbox-gl';
import type { FeatureCollection, Point } from 'geojson';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import type { MapboxClusterItem } from './MapboxClusterItem.js';

/**
 * Document-level event a `MapboxCluster` dispatches when its instance mounts, so
 * a `MapboxClusterItem` that mounted *before* its cluster can retry resolving it
 * and register itself once the cluster is connected. The dispatching
 * `MapboxCluster` instance travels in `detail`.
 */
export const MAPBOX_CLUSTER_CONNECTED = 'mapbox-cluster:connected';

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
  };
}

/**
 * A clustered GeoJSON **source driver** whose features ARE its rendered items.
 *
 * `MapboxCluster` merges the map source and the sidebar list of a classic
 * "store locator" into a single declarative unit: `MapboxClusterItem`s (rendered
 * list entries living outside the map) push themselves into the cluster's
 * registry, and the cluster derives its clustered GeoJSON source from that
 * registry. Items self-register, the cluster rebuilds (debounced) on every
 * registry change, gated on `whenMapReady`, and nothing observes or `$query`s.
 *
 * The cluster is deliberately **thin**: it owns only the map data and the
 * clustering interaction (a clustered source, the three layers and the
 * click-to-zoom on clusters). It does **not** select, fly to, filter by viewport
 * or open popups — those search-UX concerns belong to the optional
 * [`StoreLocator`](./StoreLocator.js) orchestrator, which drives them on top of a
 * cluster. Used standalone, a `MapboxCluster` still renders a working clustered
 * map + list (points render, clusters zoom on click); it simply reports a click
 * on an unclustered point through the `item-click` event and lets the caller
 * decide what it means.
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
    emits: ['cluster-click', 'item-click', 'update'],
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
   * The registered `MapboxClusterItem`s, in registration order.
   *
   * Read-only surface for an orchestrator (e.g. `StoreLocator`) that needs to
   * iterate the item set for viewport filtering, distance sorting or selection —
   * the cluster owns the registry, consumers only read it.
   */
  get items(): MapboxClusterItem[] {
    return this.__items;
  }

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
      this.__scheduleRebuild();
    }
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
   * Push the derived feature collection to the source and announce the change.
   * No-op until the map is ready (the initial build happens in `whenMapReady`).
   * @private
   */
  __rebuild() {
    const map = this.__readyMap;

    if (!map) {
      return;
    }

    this.setData(this.featureCollection as GeoJSONSourceSpecification['data']);
    // Let an orchestrator react to the new item set (fit the map, refilter the
    // list). The cluster itself never fits or filters — it only reports.
    this.$emit('update', this.__items);
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
   * Report a click on an unclustered point: resolve the feature back to the
   * registered item behind it and emit `item-click`. The cluster makes no
   * decision about what a click means — an orchestrator (e.g. `StoreLocator`)
   * listens and selects, opens a popup, etc.
   * @private
   */
  __handleUnclusteredClick = (event: MapMouseEvent) => {
    const feature = event.features?.[0];
    const id = feature?.properties?.id;
    const item =
      id === undefined || id === null
        ? undefined
        : this.__items.find((candidate) => candidate.id === String(id));

    this.$emit('item-click', item, feature, event);
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
   * Mounted hook: build the source and layers, wire the clustering interaction
   * and announce the initial item set — all once the map is ready.
   */
  mounted() {
    // Announce the cluster so any `MapboxClusterItem` that mounted before it —
    // and is waiting on `MAPBOX_CLUSTER_CONNECTED` — can register now. Items
    // register independently of map readiness, so this fires outside the
    // `whenMapReady` gate.
    document.dispatchEvent(new CustomEvent(MAPBOX_CLUSTER_CONNECTED, { detail: this }));

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

      // Announce the seeded item set so an orchestrator can run its first fit +
      // viewport filter against a cluster that was already populated at load.
      this.$emit('update', this.__items);
    });
  }

  /**
   * Teardown hook: tear down listeners, layers and source.
   */
  __onDestroyed() {
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

      for (const id of [clustersId, clusterCountId, unclusteredPointId]) {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
      }

      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }

    this.__items = [];
  }
}

export default MapboxCluster;
