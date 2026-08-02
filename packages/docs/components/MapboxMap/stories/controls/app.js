import { registerComponents } from '@studiometa/js-toolkit';
import {
  MapboxMap,
  MapboxNavigationControl,
  MapboxGeolocateControl,
  MapboxFullscreenControl,
} from '@studiometa/ui-mapbox';

// Register every component the markup uses.
registerComponents(
  MapboxMap,
  MapboxNavigationControl,
  MapboxGeolocateControl,
  MapboxFullscreenControl,
);
