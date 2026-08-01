import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import type { LayerSpecification, Map } from 'mapbox-gl';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { claimMapboxOwnership, getMapboxOwner, releaseMapboxOwnership } from './utils.js';

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
   * Whether this instance owns the layer under its id. Only a layer this
   * instance owns may be removed on teardown; a layer declared outside the
   * family, or one a newer sibling has since adopted, is left untouched.
   * @private
   */
  __added = false;

  /**
   * The `kind:id` ownership key for this layer.
   * @private
   */
  get __ownershipKey(): string {
    return `layer:${this.$options.id}`;
  }

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
    const map = this.__readyMap;
    const { id } = this.$options;

    if (!map || map.getLayer(id) || !this.__sourceIsAvailable(map)) {
      return;
    }

    map.off('sourcedata', this.__handleSourceData);
    queueMicrotask(() => {
      if (this.$isMounted) {
        this.__commitLayer(map);
      }
    });
  };

  /**
   * Add the layer to the map, or adopt an existing one.
   *
   * When the id is free the layer is added and ownership claimed. When a layer
   * with this id already exists, re-adding it would throw a duplicate-id error,
   * so it is left in place; ownership is only taken over from a sibling
   * `MapboxLayer` (e.g. a `Fetch` swap), never from an externally declared layer.
   * @private
   * @param {Map} map
   */
  __commitLayer(map: Map): void {
    const { beforeId, id, layer } = this.$options;
    // `$options.layer` returns a freshly parsed object, so re-apply the id.
    layer.id = id;

    if (map.getLayer(id)) {
      // The id is taken. Only adopt it from another family instance (e.g. a
      // `Fetch` swap that mounted the replacement before the original tore
      // down); an externally declared layer stays untouched. Adopt AND refresh:
      // the incoming definition may differ in source/type/paint/layout/filter/
      // zoom range/beforeId, so re-add it (we own it) rather than leaving Mapbox
      // rendering the outgoing definition — matching how `MapboxSource` refreshes
      // its data on adopt.
      if (getMapboxOwner(map, this.__ownershipKey)) {
        map.removeLayer(id);
        map.addLayer(layer, beforeId);
        claimMapboxOwnership(map, this.__ownershipKey, this);
        this.__added = true;
      }
      return;
    }

    map.addLayer(layer, beforeId);
    claimMapboxOwnership(map, this.__ownershipKey, this);
    this.__added = true;
  }

  /**
   * Whether the source referenced by the layer is available on the map.
   *
   * Layers referencing an inline source object — or no source at all, like a
   * `background` layer — are always considered available.
   * @private
   * @param   {Map} map
   * @returns {boolean}
   */
  __sourceIsAvailable(map: Map): boolean {
    const { source } = this.$options.layer as { source?: unknown };
    return typeof source !== 'string' || Boolean(map.getSource(source));
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady((map) => {
      // The referenced source may be declared by a sibling `MapboxSource` that
      // has not mounted yet — sibling mount order is not guaranteed. Adding a
      // layer before its source silently fails, so wait for the source to be
      // available.
      if (this.__sourceIsAvailable(map)) {
        this.__commitLayer(map);
      } else {
        map.on('sourcedata', this.__handleSourceData);
      }
    });
  }

  /**
   * Flush the pending `sourcedata` listener against the map being removed, while
   * it is still referenceable — `__onDestroyed` runs later with `__readyMap`
   * already cleared and could not reach the map to unsubscribe.
   * @protected
   * @param {Map} map
   */
  __onMapRemove(map: Map) {
    map.off('sourcedata', this.__handleSourceData);
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    const map = this.__readyMap;
    const { id } = this.$options;

    map?.off('sourcedata', this.__handleSourceData);

    // Only remove a layer this instance still owns: a newer sibling may have
    // adopted the id, and a removed map is already gone (`__readyMap` is unset).
    if (
      this.__added &&
      getMapboxOwner(map as object, this.__ownershipKey) === this &&
      map?.getLayer(id)
    ) {
      map.removeLayer(id);
      releaseMapboxOwnership(map, this.__ownershipKey, this);
    }
  }
}

export default MapboxLayer;
