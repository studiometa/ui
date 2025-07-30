import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { Marker } from 'mapbox-gl';
import { AbstractMapboxMapChild, AbstractMapboxMapChildProps } from './AbstractMapboxMapChild.js';
import { MapboxPopup } from './MapboxPopup.js';

export interface MapboxMarkerProps extends AbstractMapboxMapChildProps {
  $options: {
    lngLat: [number, number];
    markerOptions: any;
  };
  $children: {
    MapboxPopup: MapboxPopup[];
  };
}

/**
 * Add a marker to Mapbox map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxMarker<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxMarkerProps
> {
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

  __marker: Marker;

  get marker() {
    if (!this.__marker) {
      this.__marker = new Marker(this.markerOptions);
    }

    return this.__marker;
  }

  get popup() {
    return this.$children.MapboxPopup[0];
  }

  get markerOptions() {
    if (this.$options.markerOptions) {
      return this.$options.markerOptions;
    }

    return {};
  }

  mounted() {
    this.marker.setLngLat(this.$options.lngLat).addTo(this.map);
    if (this.popup) {
      this.marker.setPopup(this.popup.popup);
    }
  }

  destroyed() {
    this.marker?.remove();
    this.__marker = undefined;
  }
}
