import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { SourceSpecification } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';

export interface MapboxSourceProps extends AbstractMapboxMapChildProps {
  $options: {
    id: string;
    /**
     * The source specification, e.g. `{ type: 'geojson', data }`.
     * @see https://docs.mapbox.com/style-spec/reference/sources/
     */
    source: SourceSpecification;
  };
}

/**
 * Add a source to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxSource<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxSourceProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxSource',
    options: {
      id: String,
      source: Object,
    },
  };

  /**
   * Mounted hook.
   */
  mounted() {
    const { id, source } = this.$options;

    if (!this.map.getSource(id)) {
      this.map.addSource(id, source);
    }
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    const { id } = this.$options;

    if (!this.map.getSource(id)) {
      return;
    }

    // Remove every layer tied to the source before removing the source itself,
    // otherwise Mapbox throws because layers still reference a missing source.
    for (const layer of this.map.getStyle().layers) {
      if ('source' in layer && layer.source === id) {
        this.map.removeLayer(layer.id);
      }
    }

    this.map.removeSource(id);
  }
}
