import { Base, getClosestParent } from '@studiometa/js-toolkit';
import mapbox from 'mapbox-gl';
import { MapboxMap } from './MapboxMap.js';

export class MapboxMarker extends Base {
  static config = {
    name: 'MapboxMarker',
    options: {
      lng: Number,
      lat: Number,
      // Marker options. (https://docs.mapbox.com/mapbox-gl-js/api/markers#marker)
      markerOptions: Object,
    },
  };

  marker: mapbox.Marker | null = null;

  get map() {
    return getClosestParent(this, MapboxMap)?.map;
  }

  get markerOptions() {
    if (this.$options.markerOptions) {
      return this.$options.markerOptions;
    }

    return {};
  }

  get lngLat() {
    return [this.$options.lng, this.$options.lat];
  }

  mounted() {
    this.marker = new mapbox.Marker(this.markerOptions).setLngLat(this.lngLat).addTo(this.map);
  }

  destroyed() {
    this.marker?.remove();
  }
}
