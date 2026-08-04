import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Minimal stand-ins for the injected modules. These specs exercise the
 * resolution logic itself, so they mock the peers with unique sentinels and load
 * a *fresh* copy of `dependencies.ts` per test (its resolved instance is a
 * module-level singleton) with `vi.resetModules()`.
 */
const importedMapboxGl = { source: 'imported' };
const importedGeocoder = class ImportedGeocoder {};

vi.mock('mapbox-gl', () => ({ default: importedMapboxGl }));
vi.mock('@mapbox/mapbox-gl-geocoder', () => ({ default: importedGeocoder }));

async function freshDependencies() {
  vi.resetModules();
  return import('@studiometa/ui-mapbox/dependencies');
}

describe('ui-mapbox dependency injection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws from getMapboxGl before mapbox-gl is resolved', async () => {
    const { getMapboxGl } = await freshDependencies();
    expect(() => getMapboxGl()).toThrow(/has not been resolved/);
  });

  it('lazily imports mapbox-gl through resolveMapboxGl and caches it for getMapboxGl', async () => {
    const { resolveMapboxGl, getMapboxGl } = await freshDependencies();

    const resolved = await resolveMapboxGl();
    expect(resolved).toBe(importedMapboxGl);
    // Memoized: the sync accessor now returns the same instance.
    expect(getMapboxGl()).toBe(importedMapboxGl);
    // Repeated calls resolve to the same instance without re-importing.
    expect(await resolveMapboxGl()).toBe(importedMapboxGl);
  });

  it('prefers a provided mapbox-gl instance over the fallback import', async () => {
    const { provideMapboxGl, resolveMapboxGl, getMapboxGl } = await freshDependencies();
    const injected = { source: 'injected' } as never;

    provideMapboxGl(injected);
    expect(getMapboxGl()).toBe(injected);
    expect(await resolveMapboxGl()).toBe(injected);
    expect(await resolveMapboxGl()).not.toBe(importedMapboxGl);
  });

  it('does not let an in-flight fallback import overwrite a later injection', async () => {
    const { resolveMapboxGl, provideMapboxGl, getMapboxGl } = await freshDependencies();
    const injected = { source: 'injected' } as never;

    // Start the fallback import, then inject before it settles.
    const pending = resolveMapboxGl();
    provideMapboxGl(injected);

    // The injected instance wins everywhere: the sync accessor, a fresh resolve,
    // and even the promise captured before the injection.
    expect(getMapboxGl()).toBe(injected);
    expect(await resolveMapboxGl()).toBe(injected);
    expect(await pending).toBe(injected);
  });

  it('lazily imports the geocoder through resolveMapboxGeocoder', async () => {
    const { resolveMapboxGeocoder } = await freshDependencies();
    expect(await resolveMapboxGeocoder()).toBe(importedGeocoder);
  });

  it('prefers a provided geocoder constructor over the fallback import', async () => {
    const { provideMapboxGeocoder, resolveMapboxGeocoder } = await freshDependencies();
    const injected = class InjectedGeocoder {} as never;

    provideMapboxGeocoder(injected);
    expect(await resolveMapboxGeocoder()).toBe(injected);
  });
});
