import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
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
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';

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
    data: GeoJSONSourceSpecification['data'];
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
 * Display a clustered GeoJSON source on the map.
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
    emits: ['cluster-click', 'feature-click', 'feature-mouseenter', 'feature-mouseleave'],
    options: {
      // js-toolkit options do not support union types: `data` is declared as a
      // String so a URL to a GeoJSON file can be passed via a data attribute,
      // which is the canonical clustered source usage.
      data: String,
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
   * Derive an id for the given suffix from the instance base id.
   * @private
   * @param   {string} suffix
   * @returns {string}
   */
  __getId(suffix: string): string {
    return `${this.__id}-${suffix}`;
  }

  /**
   * Click handler for the clusters layer, zooming on the clicked cluster.
   * @private
   */
  __handleClustersClick = (event: MapMouseEvent) => {
    const feature = this.map.queryRenderedFeatures(event.point, {
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

    const source = this.map.getSource<GeoJSONSource>(this.__getId('source'));

    source?.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error || zoom === null || zoom === undefined || feature.geometry.type !== 'Point') {
        return;
      }

      this.map.easeTo({
        center: feature.geometry.coordinates as LngLatLike,
        zoom,
      });
    });
  };

  /**
   * Set a pointer cursor when entering the clusters layer.
   * @private
   */
  __handleClustersMouseenter = () => {
    this.map.getCanvas().style.cursor = 'pointer';
  };

  /**
   * Reset the cursor when leaving the clusters layer.
   * @private
   */
  __handleClustersMouseleave = () => {
    this.map.getCanvas().style.cursor = '';
  };

  /**
   * Emit a `feature-click` event for the clicked unclustered point.
   * @private
   */
  __handleFeatureClick = (event: MapMouseEvent) => {
    this.$emit('feature-click', event.features?.[0], event);
  };

  /**
   * Emit a `feature-mouseenter` event and set a pointer cursor.
   * @private
   */
  __handleFeatureMouseenter = (event: MapMouseEvent) => {
    this.$emit('feature-mouseenter', event.features?.[0], event);
    this.map.getCanvas().style.cursor = 'pointer';
  };

  /**
   * Emit a `feature-mouseleave` event and reset the cursor.
   * @private
   */
  __handleFeatureMouseleave = (event: MapMouseEvent) => {
    this.$emit('feature-mouseleave', event);
    this.map.getCanvas().style.cursor = '';
  };

  /**
   * Mounted hook.
   */
  mounted() {
    const {
      data,
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
    const clustersFilter = ['has', 'point_count'] as FilterSpecification;
    const unclusteredFilter = ['!', ['has', 'point_count']] as FilterSpecification;

    const source: GeoJSONSourceSpecification = {
      type: 'geojson',
      cluster: true,
      data,
      clusterMaxZoom,
      clusterRadius,
      clusterMinPoints,
      clusterProperties,
    };

    const clustersLayer: CircleLayerSpecification = {
      id: this.__getId('clusters'),
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
      id: this.__getId('unclustered-point'),
      type: unclusteredPointLayerType,
      source: sourceId,
      filter: unclusteredFilter,
      layout: unclusteredPointLayout,
      paint: unclusteredPointPaint,
    } as unknown as LayerSpecification;

    this.map.addSource(sourceId, source);
    this.map.addLayer(clustersLayer);
    this.map.addLayer(clusterCountLayer);
    this.map.addLayer(unclusteredPointLayer);

    this.map.on('click', clustersLayer.id, this.__handleClustersClick);
    this.map.on('mouseenter', clustersLayer.id, this.__handleClustersMouseenter);
    this.map.on('mouseleave', clustersLayer.id, this.__handleClustersMouseleave);
    this.map.on('click', unclusteredPointLayer.id, this.__handleFeatureClick);
    this.map.on('mouseenter', unclusteredPointLayer.id, this.__handleFeatureMouseenter);
    this.map.on('mouseleave', unclusteredPointLayer.id, this.__handleFeatureMouseleave);
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    if (!this.map) {
      return;
    }

    const clustersId = this.__getId('clusters');
    const clusterCountId = this.__getId('cluster-count');
    const unclusteredPointId = this.__getId('unclustered-point');
    const sourceId = this.__getId('source');

    this.map.off('click', clustersId, this.__handleClustersClick);
    this.map.off('mouseenter', clustersId, this.__handleClustersMouseenter);
    this.map.off('mouseleave', clustersId, this.__handleClustersMouseleave);
    this.map.off('click', unclusteredPointId, this.__handleFeatureClick);
    this.map.off('mouseenter', unclusteredPointId, this.__handleFeatureMouseenter);
    this.map.off('mouseleave', unclusteredPointId, this.__handleFeatureMouseleave);

    for (const id of [clustersId, clusterCountId, unclusteredPointId]) {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    }

    if (this.map.getSource(sourceId)) {
      this.map.removeSource(sourceId);
    }
  }
}
