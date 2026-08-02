import { registerComponent } from '@studiometa/js-toolkit';
import {
  MapboxMap,
  MapboxNavigationControl,
  MapboxGeolocateControl,
  MapboxFullscreenControl,
} from '@studiometa/ui-mapbox';

// Every component is self-registering: register each one the markup uses.
registerComponent(MapboxMap);
registerComponent(MapboxNavigationControl);
registerComponent(MapboxGeolocateControl);
registerComponent(MapboxFullscreenControl);
