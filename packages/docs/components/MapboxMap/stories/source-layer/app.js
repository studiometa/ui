import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap, MapboxSource, MapboxLayer } from '@studiometa/ui-mapbox';

// Every component is self-registering: register each one the markup uses.
registerComponent(MapboxMap);
registerComponent(MapboxSource);
registerComponent(MapboxLayer);
