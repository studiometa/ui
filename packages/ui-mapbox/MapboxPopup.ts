import { type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import mapboxgl from 'mapbox-gl';
import type { Popup, PopupOptions } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import type { MapboxMarker } from './MapboxMarker.js';

export interface MapboxPopupProps extends AbstractMapboxMapChildProps {
  $options: {
    lngLat: [number, number];
    /**
     * Popup options.
     * @see https://docs.mapbox.com/mapbox-gl-js/api/markers#popup
     */
    popupOptions: PopupOptions;
  };
}

/**
 * Display a popup on a MapboxMap map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap
 */
export class MapboxPopup<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxPopupProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxPopup',
    options: {
      lngLat: {
        type: Array,
        default: () => [0, 0],
      },
      popupOptions: Object,
    },
  };

  /**
   * Popup instance.
   * @private
   */
  __popup: Popup;

  /**
   * The mapbox Popup instance.
   */
  get popup() {
    if (!this.__popup) {
      this.__popup = new mapboxgl.Popup(this.$options.popupOptions);
    }

    return this.__popup;
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady((map) => {
      const { popup, $el, $options } = this;

      popup.setLngLat($options.lngLat);

      const content = $el.innerHTML.trim();
      if (content) {
        popup.setHTML(content);
        // Hide the source markup so the content is not rendered twice: once in
        // the popup and once in the document.
        $el.hidden = true;
      }

      // Only add the popup directly to the map when it is not inside a marker:
      // a marker owns its popup and attaches it through `setPopup`.
      const marker = this.$closest<MapboxMarker>('MapboxMarker');
      if (!marker) {
        popup.addTo(map);
      }
    });
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    this.__popup?.remove();
    this.__popup = undefined;
    super.destroyed();
  }
}

export default MapboxPopup;
