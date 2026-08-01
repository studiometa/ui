import { registerComponents, type BaseConstructor } from '@studiometa/js-toolkit';
import { MapboxMap } from './MapboxMap.js';
import { MapboxMarker } from './MapboxMarker.js';
import { MapboxPopup } from './MapboxPopup.js';
import { MapboxNavigationControl } from './MapboxNavigationControl.js';
import { MapboxGeolocateControl } from './MapboxGeolocateControl.js';
import { MapboxFullscreenControl } from './MapboxFullscreenControl.js';
import { MapboxGeocoder } from './MapboxGeocoder.js';
import { MapboxSource } from './MapboxSource.js';
import { MapboxLayer } from './MapboxLayer.js';
import { MapboxImage } from './MapboxImage.js';
import { MapboxImages } from './MapboxImages.js';
import { MapboxCluster } from './MapboxCluster.js';
import { MapboxClusterItem } from './MapboxClusterItem.js';

/**
 * Register the whole `@studiometa/ui-mapbox` family globally in one call.
 *
 * Since `MapboxMap` no longer declares its children, each component must be
 * registered so js-toolkit's document-wide `MutationObserver` mounts it whenever
 * its element enters the DOM. This helper registers every component at once so a
 * consumer does not have to list them one by one — but per-component
 * `registerComponent` calls remain possible when only a subset is needed.
 *
 * @returns {ReturnType<typeof registerComponents>} A promise resolving to the
 *   mounted component instances.
 */
export function registerMapboxComponents() {
  return registerComponents<BaseConstructor>(
    MapboxMap,
    MapboxMarker,
    MapboxPopup,
    MapboxNavigationControl,
    MapboxGeolocateControl,
    MapboxFullscreenControl,
    MapboxGeocoder,
    MapboxSource,
    MapboxLayer,
    MapboxImage,
    MapboxImages,
    MapboxCluster,
    MapboxClusterItem,
  );
}

export default registerMapboxComponents;
