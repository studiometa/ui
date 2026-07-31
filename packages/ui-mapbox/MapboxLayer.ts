import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { LayerSpecification } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';

export interface MapboxLayerProps extends AbstractMapboxMapChildProps {
  $options: {
    id: string;
    layer: LayerSpecification;
    beforeId: string;
  };
}

/**
 * Add a layer to the map.
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
 */
export class MapboxLayer<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxLayerProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxLayer',
    options: {
      id: String,
      layer: Object,
      beforeId: String,
    },
  };

  /**
   * Mounted hook.
   */
  mounted() {
    const { beforeId, id, layer } = this.$options;
    layer.id = id;
    this.map.addLayer(layer, beforeId);
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    const { id } = this.$options;

    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }
  }
}
