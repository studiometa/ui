import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { addMapboxImage, type MapboxImageOptions } from './utils.js';

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
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
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
   * Whether this instance actually added the image to the map sprite. Only
   * sprites this instance added may be removed on teardown; a pre-existing
   * sprite (registered by someone else) must be left untouched.
   * @private
   */
  __added = false;

  /**
   * Mounted hook.
   */
  mounted() {
    this.whenMapReady(async (map) => {
      const { name, url, options } = this.$options;
      const { image, added } = await addMapboxImage(map, { name, url, options });

      // The component may have been destroyed while the image was loading.
      // `addMapboxImage` both loads AND adds, so the sprite is already registered
      // on the map: undo the add (only if THIS call added it) and bail before
      // emitting so no orphan sprite survives teardown (`destroyed()` already ran
      // and found nothing to remove).
      if (!this.$isMounted) {
        if (added && map.hasImage(name)) {
          map.removeImage(name);
        }
        return;
      }

      this.__added = added;
      this.$emit('ready', { name, image, options });
    });
  }

  /**
   * Teardown hook.
   */
  __onDestroyed() {
    const { name } = this.$options;
    const map = this.__readyMap;

    if (this.__added && map?.hasImage(name)) {
      map.removeImage(name);
    }
  }
}

export default MapboxImage;
