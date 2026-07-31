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
