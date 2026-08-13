import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Minimal stand-in for the injected module. These specs exercise the
 * resolution logic itself, so they mock the peer with a unique sentinel and
 * load a *fresh* copy of `dependencies.ts` per test (its resolved instance is
 * a module-level singleton) with `vi.resetModules()`.
 */
const importedMotion = { animate: () => {} };

vi.mock('motion', () => importedMotion);

async function freshDependencies() {
  vi.resetModules();
  return import('@studiometa/ui-motion/dependencies');
}

describe('ui-motion dependency injection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws from getMotion before motion is resolved', async () => {
    const { getMotion } = await freshDependencies();
    expect(() => getMotion()).toThrow(/has not been resolved/);
  });

  it('lazily imports motion through resolveMotion and caches it for getMotion', async () => {
    const { resolveMotion, getMotion } = await freshDependencies();

    const resolved = await resolveMotion();
    expect(resolved.animate).toBe(importedMotion.animate);
    // Memoized: the sync accessor now returns the same instance.
    expect(getMotion()).toBe(resolved);
    // Repeated calls resolve to the same instance without re-importing.
    expect(await resolveMotion()).toBe(resolved);
  });

  it('prefers a provided motion instance over the fallback import', async () => {
    const { provideMotion, resolveMotion, getMotion } = await freshDependencies();
    const injected = { animate: () => {} } as never;

    provideMotion(injected);
    expect(getMotion()).toBe(injected);
    expect(await resolveMotion()).toBe(injected);
  });

  it('does not let an in-flight fallback import overwrite a later injection', async () => {
    const { resolveMotion, provideMotion, getMotion } = await freshDependencies();
    const injected = { animate: () => {} } as never;

    // Start the fallback import, then inject before it settles.
    const pending = resolveMotion();
    provideMotion(injected);

    // The injected instance wins everywhere: the sync accessor, a fresh resolve,
    // and even the promise captured before the injection.
    expect(getMotion()).toBe(injected);
    expect(await resolveMotion()).toBe(injected);
    expect(await pending).toBe(injected);
  });
});
