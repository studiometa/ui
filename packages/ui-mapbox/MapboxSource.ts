import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { SourceSpecification, GeoJSONSourceSpecification, GeoJSONSource } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { claimMapboxOwnership, getMapboxOwner, releaseMapboxOwnership } from './utils.js';

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
    const content = script?.textContent?.trim();

    // Only inject inline data when the script ref holds actual content. A
    // missing, empty or whitespace-only ref is treated as "no inline data" and
    // the `source` option is used as is instead of injecting `data: null`.
    if (!content) {
      return source;
    }

    try {
      const data = JSON.parse(content) as GeoJSONSourceSpecification['data'];
      return { ...source, data } as SourceSpecification;
    } catch (err) {
      this.$warn('Invalid JSON in the `geojson` ref:', err);
      return source;
    }
  }

  /**
   * Whether this instance owns the source under its id. Only a source this
   * instance owns — along with the layers tied to it — may be removed on
   * teardown; a source declared by someone else outside the family is left
   * untouched, and a source a newer sibling has since adopted is left to that
   * sibling.
   * @private
   */
  __added = false;

  /**
   * The `kind:id` ownership key for this source.
   * @private
   */
  get __ownershipKey(): string {
    return `source:${this.$options.id}`;
  }

  /**
   * Mounted hook.
   *
   * Adopt-or-add: when the id is free, add the source and claim ownership. When
   * a source with this id already exists, adding it again would throw a
   * duplicate-id error, so instead update its data (for GeoJSON) and — when the
   * existing source belongs to a sibling `MapboxSource` (e.g. a `Fetch` swap
   * mounted the replacement before the original tore down) — take over
   * ownership. A source declared outside the family is left untouched and not
   * owned.
   */
  mounted() {
    this.whenMapReady((map) => {
      const { id } = this.$options;
      const { source } = this;

      if (!map.getSource(id)) {
        map.addSource(id, source);
        claimMapboxOwnership(map, this.__ownershipKey, this);
        this.__added = true;
        return;
      }

      // The id is taken. Only adopt it from another family instance; an
      // externally declared source stays untouched.
      if (getMapboxOwner(map, this.__ownershipKey)) {
        if (source.type === 'geojson' && 'data' in source) {
          const existing = map.getSource<GeoJSONSource>(id);
          existing?.setData(source.data as GeoJSONSourceSpecification['data']);
        }

        claimMapboxOwnership(map, this.__ownershipKey, this);
        this.__added = true;
      }
    });
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    const map = this.__readyMap;
    const { id } = this.$options;

    // Only remove a source this instance still owns: a newer sibling may have
    // adopted the id, and a removed map is already gone (`__readyMap` is unset).
    if (
      this.__added &&
      getMapboxOwner(map as object, this.__ownershipKey) === this &&
      map?.getSource(id)
    ) {
      // Remove every layer tied to the source before removing the source itself,
      // otherwise Mapbox throws because layers still reference a missing source.
      for (const layer of map.getStyle().layers) {
        if ('source' in layer && layer.source === id) {
          map.removeLayer(layer.id);
        }
      }

      map.removeSource(id);
      releaseMapboxOwnership(map, this.__ownershipKey, this);
    }
  }
}

export default MapboxSource;
