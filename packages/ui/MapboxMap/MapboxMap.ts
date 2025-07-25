import { Base, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import { Map } from 'mapbox-gl';
import { MapboxMarker } from './MapboxMarker.js';
import { MapboxPopup } from './MapboxPopup.js';
import { MapboxNavigationControl } from './MapboxNavigationControl.js';
import { MapboxGeolocateControl } from './MapboxGeolocateControl.js';
import { resolveWhenMapboxMapIsLoaded } from './utils.js';

export interface MapboxMapProps extends BaseProps {
  $refs: {
    container: HTMLElement;
  };
  $children: {
    MapboxMarker: MapboxMarker[];
  };
  $options: {
    accessToken: string;
    zoom: number;
    center: [number, number];
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
    emits: ['map-load'],
    refs: ['container'],
    options: {
      accessToken: String,
      zoom: Number,
      center: {
        type: Array,
        default: () => [0, 0],
      },
    },
    components: {
      MapboxMarker: resolveWhenMapboxMapIsLoaded(MapboxMarker),
      MapboxPopup: resolveWhenMapboxMapIsLoaded(MapboxPopup),
      MapboxNavigationControl: resolveWhenMapboxMapIsLoaded(MapboxNavigationControl),
      MapboxGeolocateControl: resolveWhenMapboxMapIsLoaded(MapboxGeolocateControl),
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
      this.__map = new Map({
        container: this.$refs.container ?? this.$el,
        ...this.$options,
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
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    this.map?.remove();
    this.__map = undefined;
  }
}
