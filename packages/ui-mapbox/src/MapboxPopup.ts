import { type BaseConfig, type BaseProps } from '@studiometa/js-toolkit';
import type { Popup, PopupOptions } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { getMapboxGl } from './dependencies.js';
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
 * @see https://ui.studiometa.dev/reference/items/MapboxMap
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
   * Whether this component hid its own source element (to avoid rendering the
   * content twice). Tracked so teardown restores the original visibility only
   * when it was the one to change it.
   * @private
   */
  __didHide = false;

  /**
   * The mapbox Popup instance.
   */
  get popup() {
    if (!this.__popup) {
      this.__popup = new (getMapboxGl().Popup)(this.$options.popupOptions);
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
        // the popup and once in the document. Remember we did so — only when it
        // was visible — to restore it on teardown.
        if (!$el.hidden) {
          $el.hidden = true;
          this.__didHide = true;
        }
      }

      // When inside a marker, hand the popup to it rather than adding it to the
      // map directly (the marker owns its popup via `setPopup`). Pushing to the
      // marker — instead of letting the marker pull us — also covers the dynamic
      // append case where the marker mounted first and found no popup to query.
      const marker = this.$closest<MapboxMarker>('MapboxMarker');
      if (marker) {
        marker.setChildPopup(this);
      } else {
        popup.addTo(map);
      }
    });
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    this.__popup?.remove();
    this.__popup = undefined;

    // Restore the source element's visibility only if this component hid it, so
    // a reused or remounted element keeps its original state.
    if (this.__didHide) {
      this.$el.hidden = false;
      this.__didHide = false;
    }
  }
}

export default MapboxPopup;
