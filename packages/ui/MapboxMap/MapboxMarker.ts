import { Base, type BaseProps, type BaseConfig, getClosestParent } from '@studiometa/js-toolkit';
import { Marker } from 'mapbox-gl';
import { MapboxMap } from './MapboxMap.js';

export interface MapboxMarkerProps extends BaseProps {
  $options: {
    lng: number;
    lat: number;
    markerOptions: any;
  };
}

export class MapboxMarker<T extends BaseProps = BaseProps> extends Base<T & MapboxMarkerProps> {
  static config: BaseConfig = {
    name: 'MapboxMarker',
    options: {
      lng: Number,
      lat: Number,
      // Marker options. (https://docs.mapbox.com/mapbox-gl-js/api/markers#marker)
      markerOptions: Object,
    },
  };

  __marker: Marker;

  get marker() {
    if (!this.__marker) {
      this.__marker = new Marker(this.markerOptions);
    }

    return this.__marker;
  }

  get map() {
    return getClosestParent(this, MapboxMap)?.map;
  }

  get markerOptions() {
    if (this.$options.markerOptions) {
      return this.$options.markerOptions;
    }

    return {};
  }

  get lngLat(): [number, number] {
    return [this.$options.lng, this.$options.lat];
  }

  mounted() {
    this.marker.setLngLat(this.lngLat).addTo(this.map);
  }

  destroyed() {
    this.marker?.remove();
    this.__marker = undefined;
  }
}
