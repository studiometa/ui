import { Base, BaseConfig, BaseProps, getClosestParent } from '@studiometa/js-toolkit';
import { Popup, PopupOptions } from 'mapbox-gl';
import { MapboxMap } from './MapboxMap.js';

export interface MapboxPopupProps extends BaseProps {
  $el: HTMLTemplateElement;
  $options: {
    lat: number;
    lng: number;
    /**
     * Popup options.
     * @see https://docs.mapbox.com/mapbox-gl-js/api/markers#popup
     */
    popupOptions: PopupOptions;
  };
}

export class MapboxPopup<T extends BaseProps = BaseProps> extends Base<T & MapboxPopupProps> {
  static config: BaseConfig = {
    name: 'MapboxPopup',
    options: {
      lng: Number,
      lat: Number,
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

  get map() {
    return getClosestParent(this, MapboxMap)?.map;
  }

  get popupOptions() {
    if (this.$options.popupOptions) {
      return this.$options.popupOptions;
    }

    return {};
  }

  get lngLat(): [number, number] {
    return [this.$options.lng, this.$options.lat];
  }

  mounted() {
    this.popup.setLngLat(this.lngLat).addTo(this.map);

    if (this.$el.content.childNodes.length === 1) {
      this.popup.setDOMContent(this.$el.content.firstChild);
    } else if (this.$el.content.childNodes.length > 1) {
      this.popup.setHTML(this.$el.innerHTML);
    }
  }

  destroyed() {
    this.popup?.remove();
    this.__popup = undefined;
  }
}
