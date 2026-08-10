import { registerManifest } from '@studiometa/js-toolkit/registerManifest';
import { manifest } from './manifest.js';

// Side-effect entry: importing this module registers the `@studiometa/ui-mapbox` manifest with the
// shared js-toolkit autoload runtime and ensures the autoloader starts. There is nothing to export
// — `import` is the contract. Importing it alongside `@studiometa/ui/autoload` coalesces into a
// single loader over the composed set.
if (typeof document !== 'undefined') {
  registerManifest(manifest);
}
