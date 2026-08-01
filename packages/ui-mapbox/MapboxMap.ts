import { Base, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { Map, MapOptions } from 'mapbox-gl';
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
    // Each child is a lazy `() => import(...)` loader rather than a static
    // import, so a downstream bundler code-splits the child wrapper code into
    // its own chunk. js-toolkit only invokes a loader when a matching child
    // element exists, so a page using only a marker never fetches the cluster,
    // geocoder, ... chunks. `resolveWhenMapboxMapIsLoaded` still defers the
    // actual import until the map has fired `load`.
    components: {
      MapboxSource: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxSource.js').then((m) => m.MapboxSource),
      ),
      MapboxImage: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxImage.js').then((m) => m.MapboxImage),
      ),
      MapboxImages: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxImages.js').then((m) => m.MapboxImages),
      ),
      MapboxLayer: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxLayer.js').then((m) => m.MapboxLayer),
      ),
      MapboxCluster: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxCluster.js').then((m) => m.MapboxCluster),
      ),
      MapboxFullscreenControl: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxFullscreenControl.js').then((m) => m.MapboxFullscreenControl),
      ),
      MapboxGeocoder: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxGeocoder.js').then((m) => m.MapboxGeocoder),
      ),
      MapboxGeolocateControl: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxGeolocateControl.js').then((m) => m.MapboxGeolocateControl),
      ),
      MapboxMarker: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxMarker.js').then((m) => m.MapboxMarker),
      ),
      MapboxNavigationControl: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxNavigationControl.js').then((m) => m.MapboxNavigationControl),
      ),
      MapboxPopup: resolveWhenMapboxMapIsLoaded(() =>
        import('./MapboxPopup.js').then((m) => m.MapboxPopup),
      ),
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
