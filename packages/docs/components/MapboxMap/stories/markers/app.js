import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap, MapboxMarker, MapboxPopup } from '@studiometa/ui-mapbox';

// Every component is self-registering: register each one the markup uses.
registerComponent(MapboxMap);
registerComponent(MapboxMarker);
registerComponent(MapboxPopup);
