import { Base, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { Map, MapOptions } from 'mapbox-gl';

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
    // `MapboxMap` no longer declares its children. Each child component
    // (markers, popups, controls, sources, layers, clusters, ...) is registered
    // globally and resolves this map on its own via `$closest('MapboxMap')`,
    // then waits for readiness through `AbstractMapboxMapChild.whenMapReady`.
    // This makes the whole family dynamic-DOM-native: a child appended under a
    // map at any time mounts and injects itself, and cleans up when removed.
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
