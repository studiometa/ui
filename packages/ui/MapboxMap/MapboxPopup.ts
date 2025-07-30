import { getClosestParent, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import { Popup, PopupOptions } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { MapboxMap } from './MapboxMap.js';
import { MapboxMarker } from './MapboxMarker.js';

export interface MapboxPopupProps extends BaseProps {
  $parent: MapboxMap | MapboxMarker;
  $el: HTMLTemplateElement;
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

  __popup: Popup;

  get popup() {
    if (!this.__popup) {
      this.__popup = new Popup();
    }

    return this.__popup;
  }

  get popupOptions() {
    if (this.$options.popupOptions) {
      return this.$options.popupOptions;
    }

    return {};
  }

  mounted() {
    this.popup.setLngLat(this.$options.lngLat);

    if (this.$el.content.childNodes.length === 1) {
      this.popup.setDOMContent(this.$el.content.firstChild);
    } else if (this.$el.content.childNodes.length > 1) {
      this.popup.setHTML(this.$el.innerHTML);
    }

    if (this.map && this.$parent instanceof MapboxMap) {
      this.popup.addTo(this.map);
    }
  }

  destroyed() {
    this.popup?.remove();
    this.__popup = undefined;
  }
}
