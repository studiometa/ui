import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { Marker, MarkerOptions } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { MapboxPopup } from './MapboxPopup.js';

export interface MapboxMarkerProps extends AbstractMapboxMapChildProps {
  $options: {
    lngLat: [number, number];
    markerOptions: MarkerOptions;
  };
}

/**
 * Add a marker to Mapbox map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxMarker<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxMarkerProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxMarker',
    options: {
      lngLat: {
        type: Array,
        default: () => [0, 0],
      },
      // Marker options. (https://docs.mapbox.com/mapbox-gl-js/api/markers#marker)
      markerOptions: Object,
    },
    components: {
      MapboxPopup,
    },
  };

  /**
   * Marker instance.
   * @private
   */
  __marker: Marker;

  /**
   * The mapbox Marker instance.
   */
  get marker() {
    if (!this.__marker) {
      this.__marker = new mapboxgl.Marker(this.$options.markerOptions);
    }

    return this.__marker;
  }

  /**
   * The optional child popup component instance.
   */
  get popup() {
    return this.$query<MapboxPopup>('MapboxPopup')[0];
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.marker.setLngLat(this.$options.lngLat).addTo(this.map);
    if (this.popup) {
      this.marker.setPopup(this.popup.popup);
    }
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    this.__marker?.remove();
    this.__marker = undefined;
  }
}

export default MapboxMarker;
