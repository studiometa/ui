import {
  Base,
  type BaseConfig,
  type BaseConstructor,
  type BaseProps,
} from '@studiometa/js-toolkit';
import { Map } from 'mapbox-gl';
import { MapboxMarker } from './MapboxMarker.js';
import { MapboxPopup } from './MapboxPopup.js';

export interface MapboxMapProps extends BaseProps {
  $refs: {
    container: HTMLElement;
  },
  $children: {
    MapboxMarker: MapboxMarker[];
  };
  $options: {
    accessToken: string;
    zoom: number;
    center: [number, number];
  };
}

function resolveWhenMapIsLoaded<T extends BaseConstructor>(Component: T) {
  return (mapboxMap: MapboxMap): Promise<T> => {
    return new Promise((resolve) => {
      if (mapboxMap.isLoaded) {
        resolve(Component);
      } else {
        mapboxMap.$on(
          'map-load',
          () => {
            resolve(Component);
          },
          { once: true },
        );
      }
    });
  };
}

export class MapboxMap<T extends BaseProps = BaseProps> extends Base<T & MapboxMapProps> {
  static config: BaseConfig = {
    name: 'MapboxMap',
    emits: ['map-load'],
    refs: ['container'],
    options: {
      accessToken: String,
      zoom: Number,
      center: { type: Array, default: () => [0, 0] },
    },
    components: {
      MapboxMarker: resolveWhenMapIsLoaded(MapboxMarker),
      MapboxPopup: resolveWhenMapIsLoaded(MapboxPopup),
    },
  };

  isLoaded = false;

  __map: Map;

  get map() {
    if (!this.__map) {
      this.__map = new Map(this.mapboxOptions);
    }

    return this.__map;
  }

  get mapboxOptions() {
    return {
      container: this.$refs.container ?? this.$el,
      ...this.$options,
    };
  }

  async mounted() {
    this.map.on('load', () => {
      this.isLoaded = true;
      this.$emit('map-load', this.map);
    });
  }

  destroyed() {
    this.map?.remove();
    this.__map = undefined;
  }
}
