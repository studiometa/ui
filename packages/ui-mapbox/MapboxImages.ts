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
   * The names of the images this instance actually added to the map sprite.
   * Only these may be removed on teardown; pre-existing sprites (registered by
   * someone else) are left untouched.
   * @private
   */
  __addedNames: string[] = [];

  /**
   * Mounted hook.
   */
  async mounted() {
    const { sources } = this.$options;
    const results = await Promise.all(
      sources.map((source) => addMapboxImage(this.map, source)),
    );

    // The component may have been destroyed while the images were loading. Each
    // image this call added is already registered on the map sprite, so remove
    // the ones we own and bail before emitting to avoid leaving orphan sprites
    // behind (`destroyed()` already ran and found nothing to remove).
    if (!this.$isMounted) {
      sources.forEach((source, index) => {
        if (results[index].added && this.map?.hasImage(source.name)) {
          this.map.removeImage(source.name);
        }
      });
      return;
    }

    // Track which sprites this instance actually added so teardown never removes
    // a pre-existing one.
    this.__addedNames = sources
      .filter((_source, index) => results[index].added)
      .map((source) => source.name);

    this.$emit(
      'ready',
      results.map((result) => result.image),
    );
  }

  /**
   * Destroyed hook.
   */
  destroyed() {
    for (const name of this.__addedNames) {
      if (this.map?.hasImage(name)) {
        this.map.removeImage(name);
      }
    }
  }
}
