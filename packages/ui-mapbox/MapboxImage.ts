import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import {
  addMapboxImage,
  claimMapboxOwnership,
  getMapboxOwner,
  releaseMapboxOwnership,
  type MapboxImageOptions,
} from './utils.js';

export interface MapboxImageProps extends AbstractMapboxMapChildProps {
  $options: {
    name: string;
    url: string;
    /**
     * The image options forwarded to `map.addImage`.
     * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#addimage
     */
    options: MapboxImageOptions;
  };
}

/**
 * Load and register a single image against the map sprite.
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxImage<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxImageProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxImage',
    emits: ['ready'],
    options: {
      name: String,
      url: String,
      options: {
        type: Object,
        default: () => ({ pixelRatio: 1, sdf: false }),
      },
    },
  };

  /**
   * Whether this instance owns the sprite under its name. Only a sprite this
   * instance owns may be removed on teardown; a pre-existing sprite declared
   * outside the family is left untouched, and a sprite a newer sibling has since
   * adopted (a same-name `Fetch` swap) is left to that sibling.
   * @private
   */
  __owned = false;

  /**
   * The `kind:name` ownership key for this sprite.
   * @private
   */
  get __ownershipKey(): string {
    return `image:${this.$options.name}`;
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady(async (map) => {
      const { name, url, options } = this.$options;
      const { image, added } = await addMapboxImage(map, { name, url, options });

      // The component may have been destroyed — or the map removed/replaced —
      // while the image was loading. Undo the add (only when THIS call added it,
      // and only while the map is still current & alive; a removed map took its
      // sprites with it) and bail before emitting so no orphan sprite survives.
      if (!this.$isMounted || this.__readyMap !== map) {
        if (added && this.__readyMap === map && map.hasImage(name)) {
          map.removeImage(name);
        }
        return;
      }

      // Own the sprite when we added it, or adopt it from a family sibling — a
      // same-name `Fetch` swap that added the sprite before this instance
      // mounted — so the outgoing instance's teardown does not remove the sprite
      // this mounted replacement now depends on. An unowned external sprite is
      // left untouched (and unclaimed).
      if (added || getMapboxOwner(map, this.__ownershipKey)) {
        // Sprites expose no object identity, so liveness can only probe
        // `hasImage`: enough to drop the entry after a `setStyle` wipe or an
        // external `removeImage`, and to re-own on a `style.load` re-injection.
        claimMapboxOwnership(map, this.__ownershipKey, this, () => map.hasImage(name));
        this.__owned = true;
      }

      this.$emit('ready', { name, image, options });
    });
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    const { name } = this.$options;
    const map = this.__readyMap;

    // Only remove a sprite this instance still owns: a newer sibling may have
    // adopted the name, and a removed map is already gone (`__readyMap` is unset).
    if (
      this.__owned &&
      getMapboxOwner(map as object, this.__ownershipKey) === this &&
      map?.hasImage(name)
    ) {
      map.removeImage(name);
      releaseMapboxOwnership(map, this.__ownershipKey, this);
    }
  }
}

export default MapboxImage;
