import { registerManifest } from '@studiometa/js-toolkit/registerManifest';
import { manifest } from './manifest.js';

// Side-effect entry: importing this module registers the `@studiometa/ui` manifest with the shared
// js-toolkit autoload runtime and ensures the autoloader starts. There is nothing to export —
// `import` is the contract.
if (typeof document !== 'undefined') {
  registerManifest(manifest);
}
