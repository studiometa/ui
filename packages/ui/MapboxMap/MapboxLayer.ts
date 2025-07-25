import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import { AbstractMapboxMapChild, AbstractMapboxMapChildProps } from './AbstractMapboxMapChild.js';
import type { LayerSpecification } from 'mapbox-gl';

export interface MapboxLayerProps extends AbstractMapboxMapChildProps {
  $options: {
    id: string;
    layer: LayerSpecification;
    beforeId: string;
  };
}

export class MapboxLayer<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxLayerProps
> {
  static config: BaseConfig = {
    name: 'MapboxLayer',
    options: {
      id: String,
      layer: Object,
      beforeId: String,
    },
  };

  mounted() {
    const { beforeId, id, layer } = this.$options;
    layer.id = id;
    this.map.addLayer(layer, beforeId);
  }

  destroyed() {
    const { id } = this.$options;

    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }
  }
}
