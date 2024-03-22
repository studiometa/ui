import { Base, getClosestParent } from '@studiometa/js-toolkit';
import mapbox from 'mapbox-gl';
import { MapboxMap } from './MapboxMap.js';

export class MapboxPopup extends Base {
  static config = {
    name: 'MapboxPopup',
    options: {
      lng: Number,
      lat: Number,
      // Marker options. (https://docs.mapbox.com/mapbox-gl-js/api/markers#popup)
      popupOptions: Object,
    },
  };

  popup: mapbox.Popup | null = null;

  get map() {
    return getClosestParent(this, MapboxMap)?.map;
  }

  get popupOptions() {
    if (this.$options.markerOptions) {
      return this.$options.markerOptions;
    }

    return {};
  }

  get lngLat() {
    return [this.$options.lng, this.$options.lat];
  }

  mounted() {
    this.popup = new mapbox.Popup()
      .setLngLat(this.lngLat)
      .setHTML('<h1>Hello World!</h1>')
      .setMaxWidth('300px')
      .addTo(this.map);
  }

  destroyed() {
    this.popup?.remove();
  }
}
