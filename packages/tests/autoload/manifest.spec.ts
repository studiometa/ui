import { Base, type BaseConstructor } from '@studiometa/js-toolkit';
import { manifest as uiManifest } from '@studiometa/ui/manifest';
import { manifest as mapboxManifest } from '@studiometa/ui-mapbox/manifest';
import * as uiExports from '@studiometa/ui';
import * as mapboxExports from '@studiometa/ui-mapbox';
import { describe, expect, it } from 'vitest';

function isBaseConstructor(value: unknown): value is BaseConstructor {
  return typeof value === 'function' && value.prototype instanceof Base;
}

describe.each([
  ['@studiometa/ui', uiManifest, uiExports as Record<string, unknown>, 'eager'],
  ['@studiometa/ui-mapbox', mapboxManifest, mapboxExports as Record<string, unknown>, 'visible'],
] as const)('%s ./manifest export', (packageName, manifest, exports, strategy) => {
  it('keys every entry by its own token and its own package name', () => {
    for (const [token, entry] of Object.entries(manifest)) {
      expect(entry.token).toBe(token);
      expect(entry.packageName).toBe(packageName);
      expect(entry.strategy).toBe(strategy);
    }
  });

  it('loads each entry to the Base constructor exposed by the barrel', async () => {
    for (const entry of Object.values(manifest)) {
      const Constructor = await entry.load();
      expect(isBaseConstructor(Constructor)).toBe(true);
      expect(exports[entry.exportName]).toBe(Constructor);
    }
  });
});
