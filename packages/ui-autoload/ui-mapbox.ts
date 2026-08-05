import { manifest } from '@studiometa/ui-mapbox/manifest';
import { registerManifest } from './runtime.js';

// Side-effect entry: importing this module registers the `@studiometa/ui-mapbox` manifest with the
// shared runtime and ensures the autoloader starts. There is nothing to export — `import` is the
// contract. Importing it alongside `./ui` coalesces into a single loader over the composed set.
if (typeof document !== 'undefined') {
  registerManifest(manifest);
}
