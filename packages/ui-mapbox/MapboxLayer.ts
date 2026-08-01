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
   * Add the layer to the map as soon as its referenced source is available on
   * the map, then stop listening for source updates.
   *
   * The layer is added in a microtask rather than synchronously: `sourcedata`
   * can fire from within mapbox-gl's render loop and mutating the style there
   * can leave a layer half-initialized and crash the symbol placement pass.
   * @private
   */
  __handleSourceData = () => {
    const { id } = this.$options;

    if (this.map.getLayer(id) || !this.__sourceIsAvailable()) {
      return;
    }

    this.map.off('sourcedata', this.__handleSourceData);
    queueMicrotask(() => {
      // `$options.layer` returns a freshly parsed object, so re-apply the id.
      const { beforeId, layer } = this.$options;
      layer.id = id;
      if (this.$isMounted && !this.map.getLayer(id)) {
        this.map.addLayer(layer, beforeId);
      }
    });
  };

  /**
   * Whether the source referenced by the layer is available on the map.
   *
   * Layers referencing an inline source object — or no source at all, like a
   * `background` layer — are always considered available.
   * @private
   * @returns {boolean}
   */
  __sourceIsAvailable(): boolean {
    const { source } = this.$options.layer as { source?: unknown };
    return typeof source !== 'string' || Boolean(this.map.getSource(source));
  }

  /**
   * Mounted hook.
   */
  mounted() {
    const { beforeId, id, layer } = this.$options;
    layer.id = id;

    // The referenced source may be declared by a sibling `MapboxSource` that has
    // not mounted yet — sibling mount order is not guaranteed. Adding a layer
    // before its source silently fails, so wait for the source to be available.
    if (this.__sourceIsAvailable()) {
      this.map.addLayer(layer, beforeId);
    } else {
      this.map.on('sourcedata', this.__handleSourceData);
    }
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    const { id } = this.$options;

    this.map.off('sourcedata', this.__handleSourceData);

    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }
  }
}

export default MapboxLayer;
