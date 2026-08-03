import type { BaseConstructor } from '@studiometa/js-toolkit';
import type { ComponentLoadStrategy, ComponentPackageName } from './component-metadata.js';

export interface ComponentManifestEntry {
  token: string;
  packageName: ComponentPackageName;
  subpath: string;
  exportName: string;
  strategy: ComponentLoadStrategy;
  group: string;
  children?: readonly string[];
  styles?: readonly string[];
  integrations?: readonly string[];
  load: () => Promise<BaseConstructor>;
}

export { componentManifest } from './manifest.generated.js';
