import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import type { Map } from 'mapbox-gl';
import {
  addMapboxImage,
  claimMapboxOwnership,
  getMapboxOwner,
  releaseMapboxOwnership,
  type MapboxImageDefinition,
} from './utils.js';

export interface MapboxImagesProps extends AbstractMapboxMapChildProps {
  $options: {
    /**
     * A list of images to register against the map sprite.
     * @see ./MapboxImage.ts
     */
    sources: MapboxImageDefinition[];
  };
}

/**
 * Load and register a list of images against the map sprite.
 * @see https://ui.studiometa.dev/reference/items/MapboxMap/
 */
export class MapboxImages<T extends BaseProps = BaseProps> extends AbstractMapboxMapChild<
  T & MapboxImagesProps
> {
  /**
   * Config.
   */
  static config: BaseConfig = {
    name: 'MapboxImages',
    emits: ['ready'],
    options: {
      sources: {
        type: Array,
        default: () => [],
      },
    },
  };

  /**
   * The names of the sprites this instance owns. Only these may be removed on
   * teardown; pre-existing sprites (registered by someone else) are left
   * untouched, and a sprite a newer sibling has since adopted is left to it.
   * @private
   */
  __ownedNames: string[] = [];

  /**
   * The `kind:name` ownership key for the given sprite.
   * @private
   * @param   {string} name
   * @returns {string}
   */
  __ownershipKey(name: string): string {
    return `image:${name}`;
  }

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady(async (map) => {
      const { sources } = this.$options;
      const images = await Promise.all(
        sources.map(async (source) => {
          const { image, added } = await addMapboxImage(map, source);
          // Take ownership incrementally, as each image settles, rather than
          // after the whole batch: if a later entry rejects, `Promise.all`
          // rejects, but the sprites already added stay owned and removable on
          // teardown instead of orphaned.
          this.__adopt(map, source.name, added);
          return image;
        }),
      );

      // The component may have been destroyed — or the map removed/replaced —
      // while the images were loading. Remove the ones we own (only while the
      // map is still current & alive) and bail before emitting to avoid orphans.
      if (!this.$isMounted || this.__readyMap !== map) {
        if (this.__readyMap === map) {
          this.__removeOwned(map);
        }
        return;
      }

      this.$emit('ready', images);
    });
  }

  /**
   * Own a sprite this instance added, or adopt one from a family sibling (a
   * same-name `Fetch` swap), so the outgoing instance's teardown does not remove
   * a sprite this replacement now depends on.
   * @private
   * @param {Map}     map
   * @param {string}  name
   * @param {boolean} added
   */
  __adopt(map: Map, name: string, added: boolean) {
    if (added || getMapboxOwner(map, this.__ownershipKey(name))) {
      // Sprites expose no object identity, so liveness can only probe
      // `hasImage`: enough to drop the entry after a `setStyle` wipe or an
      // external `removeImage`, and to re-own on a `style.load` re-injection.
      claimMapboxOwnership(map, this.__ownershipKey(name), this, () => map.hasImage(name));
      if (!this.__ownedNames.includes(name)) {
        this.__ownedNames.push(name);
      }
    }
  }

  /**
   * Remove every sprite this instance still owns from the given map, releasing
   * ownership as it goes.
   * @private
   * @param {Map | undefined} map
   */
  __removeOwned(map?: Map) {
    for (const name of this.__ownedNames) {
      const key = this.__ownershipKey(name);
      if (getMapboxOwner(map as object, key) === this && map?.hasImage(name)) {
        map.removeImage(name);
        releaseMapboxOwnership(map, key, this);
      }
    }
    this.__ownedNames = [];
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    this.__removeOwned(this.__readyMap);
  }
}

export default MapboxImages;
