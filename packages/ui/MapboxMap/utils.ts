import type { BaseConstructor } from '@studiometa/js-toolkit';
import { type MapboxMap } from './MapboxMap.js';

export function resolveWhenMapboxMapIsLoaded<T extends BaseConstructor>(Component: T) {
  return (mapboxMap: MapboxMap): Promise<T> => {
    return new Promise((resolve) => {
      if (mapboxMap.isLoaded) {
        resolve(Component);
      } else {
        mapboxMap.$on(
          'map-load',
          () => {
            resolve(Component);
          },
          { once: true },
        );
      }
    });
  };
}
