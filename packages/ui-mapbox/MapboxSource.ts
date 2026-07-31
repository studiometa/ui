import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { SourceSpecification, GeoJSONSourceSpecification } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';

export interface MapboxSourceProps extends AbstractMapboxMapChildProps {
  $refs: {
    geojson?: HTMLScriptElement;
  };
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
    refs: ['geojson'],
    options: {
      id: String,
      source: Object,
    },
  };

  /**
   * Resolve the source specification.
   *
   * When a `geojson` ref — a `<script data-ref="geojson" type="application/json">`
   * element — is present, its content is parsed as inline GeoJSON and injected
   * as the source spec's `data`. Otherwise the `source` option is used as is.
   */
  get source(): SourceSpecification {
    const { source } = this.$options;
    const script = this.$refs.geojson;

    if (!script) {
      return source;
    }

    try {
      const data = JSON.parse(script.textContent || 'null') as GeoJSONSourceSpecification['data'];
      return { ...source, data } as SourceSpecification;
    } catch (err) {
      this.$warn('Invalid JSON in the `geojson` ref:', err);
      return source;
    }
  }

  /**
   * Mounted hook.
   */
  mounted() {
    const { id } = this.$options;
    const { source } = this;

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
