import { Base, BaseProps } from '@studiometa/js-toolkit';
import mapbox from 'mapbox-gl';
import { MapboxMarker } from './MapboxMarker.js';
import { MapboxPopup } from './MapboxPopup.js';

export interface MapboxMapProps extends BaseProps {
  $children: {
    MapboxMarker: MapboxMarker[];
  };
  $options: {
    accessToken: string;
    zoom: number;
    center: [number, number];
  };
}

export class MapboxMap <T extends BaseProps = BaseProps> extends Base<T & MapboxMapProps> {
  static config = {
    name: 'MapboxMap',
    emits: ['map-load'],
    options: {
      accessToken: String,
      zoom: Number,
      center: { type: Array, default: () => [0, 0] },
    },
    components: {
      MapboxMarker: (mapboxMap) => {
        return new Promise((resolve) => {
          if (mapboxMap.isLoaded) {
            resolve(MapboxMarker);
          } else {
            mapboxMap.$on('map-load', () => {
              resolve(MapboxMarker);
            });
          }
        });
      },
      MapboxPopup: (mapboxMap) => {
        return new Promise((resolve) => {
          if (mapboxMap.isLoaded) {
            resolve(MapboxPopup);
          } else {
            mapboxMap.$on('map-load', () => {
              resolve(MapboxPopup);
            });
          }
        });
      },
    },
  };

  map: mapbox.Map | null = null;

  isLoaded = false;

  get mapboxOptions() {
    return {
      container: this.$el,
      center: this.$options.center,
      accessToken: this.$options.accessToken,
      zoom: this.$options.zoom,
    };
  }

  async mounted() {
    this.map = new mapbox.Map(this.mapboxOptions);
    this.map.on('load', () => {
      this.isLoaded = true;
      this.$emit('map-load');
    });
  }

  destroyed() {
    this.map?.remove();
  }
}
