import { registerComponent } from '@studiometa/js-toolkit';
import { MapboxMap, MapboxImages, MapboxSource, MapboxLayer } from '@studiometa/ui-mapbox';

// Every component is self-registering: register each one the markup uses.
registerComponent(MapboxMap);
registerComponent(MapboxImages);
registerComponent(MapboxSource);
registerComponent(MapboxLayer);
