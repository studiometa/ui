import { Base, type BaseConstructor, type ComponentManifestEntry } from '@studiometa/js-toolkit';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';
import { manifest as motionManifest } from '@studiometa/ui-motion/manifest';
import * as uiExports from '@studiometa/ui';
import * as mapboxExports from '@studiometa/ui-mapbox';
import * as motionExports from '@studiometa/ui-motion';
import { describe, expect, it } from 'vitest';

function isBaseConstructor(value: unknown): value is BaseConstructor {
  return typeof value === 'function' && value.prototype instanceof Base;
}

// A generated manifest entry holds only what the registry reads before the
// module is loaded: `{ load, mountStrategy }`. Everything else stays in the
// authoring catalog the generator reads from. The token is not restated inside
// the entry — it *is* the key — which is why the assertions below read the key
// and then check that the loaded class agrees with it.
describe.each([
  ['@studiometa/ui', uiManifest, uiExports as Record<string, unknown>, 'eager'],
  ['@studiometa/ui-mapbox', mapboxManifest, mapboxExports as Record<string, unknown>, 'visible'],
  ['@studiometa/ui-motion', motionManifest, motionExports as Record<string, unknown>, 'visible'],
] as const)('%s ./manifest export', (_packageName, manifest, exports, strategy) => {
  it('declares the package mount strategy on every entry', () => {
    expect(Object.keys(manifest).length).toBeGreaterThan(0);

    for (const entry of Object.values(manifest) as ComponentManifestEntry[]) {
      expect(entry.mountStrategy).toBe(strategy);
    }
  });

  it('loads each entry to the Base constructor the barrel exports under its token', async () => {
    for (const [token, entry] of Object.entries(manifest) as [string, ComponentManifestEntry][]) {
      const Constructor = await entry.load();

      expect(isBaseConstructor(Constructor)).toBe(true);
      // The registry keys an instance, its `$id` and its `INSTANCES` entry by
      // the *resolved config name*, and reports a `registry.lazy-name-mismatch`
      // when it disagrees with the manifest key. Asserting it here is what used
      // to be `entry.token === token`.
      expect((Constructor as BaseConstructor).config.name).toBe(token);
      expect(exports[token]).toBe(Constructor);
    }
  });
});
