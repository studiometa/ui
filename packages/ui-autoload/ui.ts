import { manifest } from '@studiometa/ui/manifest';
import { registerManifest } from './runtime.js';

// Side-effect entry: importing this module registers the `@studiometa/ui` manifest with the shared
// runtime and ensures the autoloader starts. There is nothing to export — `import` is the contract.
if (typeof document !== 'undefined') {
  registerManifest(manifest);
}
