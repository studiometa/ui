import { type BaseProps, type BaseConfig } from '@studiometa/js-toolkit';
import {
  AbstractMapboxMapChild,
  type AbstractMapboxMapChildProps,
} from './AbstractMapboxMapChild.js';
import { addMapboxImage, type MapboxImageDefinition } from './utils.js';

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
 * @see https://ui.studiometa.dev/-/components/MapboxMap/
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
   * Mounted hook.
   */
  async mounted() {
    const { sources } = this.$options;
    const images = await Promise.all(
      sources.map((source) => addMapboxImage(this.map, source)),
    );

    // The component may have been destroyed while the images were loading. Each
    // image is already registered on the map sprite, so remove them all and bail
    // before emitting to avoid leaving orphan sprites behind (`destroyed()`
    // already ran and found nothing to remove).
    if (!this.$isMounted) {
      for (const { name } of sources) {
        if (this.map?.hasImage(name)) {
          this.map.removeImage(name);
        }
      }
      return;
    }

    this.$emit('ready', images);
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    for (const { name } of this.$options.sources) {
      if (this.map?.hasImage(name)) {
        this.map.removeImage(name);
      }
    }
  }
}
