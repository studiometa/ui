import { getClosestParent, type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import { Popup, PopupOptions } from 'mapbox-gl';
import { AbstractMapboxMapChild } from './AbstractMapboxMapChild.js';
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
    const { popup, $el, map, $parent, $options } = this;

    popup.setLngLat($options.lngLat);
    const el = $el instanceof HTMLTemplateElement ? $el.content : $el;

    if (el.childNodes.length === 1) {
      popup.setDOMContent(el.firstChild);
    } else if (el.childNodes.length > 1) {
      popup.setHTML($el.innerHTML);
    }

    if (map && $parent instanceof MapboxMap) {
      popup.addTo(map);
    }
  }

  destroyed() {
    this.popup?.remove();
    this.__popup = undefined;
  }
}
