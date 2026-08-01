import { Base, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { Map, MapOptions } from 'mapbox-gl';
import { MapboxMarker } from './MapboxMarker.js';
import { MapboxPopup } from './MapboxPopup.js';
import { MapboxNavigationControl } from './MapboxNavigationControl.js';
import { MapboxGeolocateControl } from './MapboxGeolocateControl.js';
import { MapboxGeocoder } from './MapboxGeocoder.js';
import { MapboxLayer } from './MapboxLayer.js';
import { MapboxFullscreenControl } from './MapboxFullscreenControl.js';
import { MapboxSource } from './MapboxSource.js';
import { MapboxImage } from './MapboxImage.js';
import { MapboxImages } from './MapboxImages.js';
import { MapboxCluster } from './MapboxCluster.js';
import { resolveWhenMapboxMapIsLoaded } from './utils.js';

const MAP_EVENTS = [
  'click',
  'dblclick',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'movestart',
  'move',
  'moveend',
  'zoomstart',
  'zoom',
  'zoomend',
  'rotatestart',
  'rotate',
  'rotateend',
  'pitchstart',
  'pitch',
  'pitchend',
  'dragstart',
  'drag',
  'dragend',
  'load',
  'idle',
  'render',
  'resize',
  'remove',
  'error',
] as const;

export interface MapboxMapProps extends BaseProps {
  $refs: {
    container: HTMLElement;
  };
  $options: {
    accessToken: string;
    zoom: number;
    center: [number, number];
    mapOptions: Partial<Omit<MapOptions, 'container'>>;
  };
}

/**
 * Display a Mapbox GL map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxMap<T extends BaseProps = BaseProps> extends Base<T & MapboxMapProps> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxMap',
    emits: ['map-load', ...MAP_EVENTS],
    refs: ['container'],
    options: {
      accessToken: String,
      zoom: Number,
      center: {
        type: Array,
        default: () => [0, 0],
      },
      // Any other `mapbox-gl` `Map` option — including `style`, `pitch`,
      // `bearing`, `bounds`, ... — spread as-is into the `Map` constructor. The
      // convenience options above act as overridable defaults, while `container`
      // is always resolved from the component and can not be overridden.
      mapOptions: {
        type: Object,
        default: () => ({}),
      },
    },
    // Order matters: js-toolkit mounts children in this declaration order, so
    // the data providers a layer depends on — sources and sprite images — are
    // declared before `MapboxLayer`. This lets `MapboxLayer` add its layer
    // directly on mount (its source already exists) instead of from inside a
    // map event handler, which mapbox-gl does not always handle safely.
    components: {
      MapboxSource: resolveWhenMapboxMapIsLoaded(MapboxSource),
      MapboxImage: resolveWhenMapboxMapIsLoaded(MapboxImage),
      MapboxImages: resolveWhenMapboxMapIsLoaded(MapboxImages),
      MapboxLayer: resolveWhenMapboxMapIsLoaded(MapboxLayer),
      MapboxCluster: resolveWhenMapboxMapIsLoaded(MapboxCluster),
      MapboxFullscreenControl: resolveWhenMapboxMapIsLoaded(MapboxFullscreenControl),
      MapboxGeocoder: resolveWhenMapboxMapIsLoaded(MapboxGeocoder),
      MapboxGeolocateControl: resolveWhenMapboxMapIsLoaded(MapboxGeolocateControl),
      MapboxMarker: resolveWhenMapboxMapIsLoaded(MapboxMarker),
      MapboxNavigationControl: resolveWhenMapboxMapIsLoaded(MapboxNavigationControl),
      MapboxPopup: resolveWhenMapboxMapIsLoaded(MapboxPopup),
    },
  };

  /**
   * Is the map loaded?
   */
  isLoaded = false;

  /**
   * Map instance.
   * @private
   */
  __map: Map;

  /**
   * The mapbox Map instance.
   */
  get map() {
    if (!this.__map) {
      this.__map = new mapboxgl.Map({
        accessToken: this.$options.accessToken,
        zoom: this.$options.zoom,
        center: this.$options.center,
        ...this.$options.mapOptions,
        container: this.$refs.container ?? this.$el,
      });
    }

    return this.__map;
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.map.on('load', () => {
      this.isLoaded = true;
      this.$emit('map-load', this.map);
    });

    for (const event of MAP_EVENTS) {
      this.map.on(event, (e) => {
        this.$emit(event, e);
      });
    }
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    this.__map?.remove();
    this.__map = undefined;
    this.isLoaded = false;
  }
}

export default MapboxMap;
