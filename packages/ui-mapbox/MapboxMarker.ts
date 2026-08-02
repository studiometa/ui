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
   * Attach a child `MapboxPopup`'s popup to this marker.
   *
   * Called from either side of the wiring, whichever mounts last: the marker
   * pulls its child popup on ready, and the popup pushes itself here when it
   * mounts after the marker (a dynamic append to an already-loaded map, where
   * the marker mounted first and found no popup to query yet). Setting the same
   * popup twice is idempotent.
   * @param {MapboxPopup} popupComponent
   */
  setChildPopup(popupComponent: MapboxPopup) {
    this.marker.setPopup(popupComponent.popup);
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady((map) => {
      this.marker.setLngLat(this.$options.lngLat).addTo(map);

      // Pull the optional child popup if it has already mounted. When it mounts
      // *after* the marker instead (dynamic append), the popup pushes itself via
      // `setChildPopup`, so either mount order wires the pair.
      if (this.popup) {
        this.setChildPopup(this.popup);
      }
    });
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    this.__marker?.remove();
    this.__marker = undefined;
  }
}

export default MapboxMarker;
