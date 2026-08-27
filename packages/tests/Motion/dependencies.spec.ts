import { describe, it, expect, vi } from 'vitest';

/**
 * Minimal stand-in for the injected module. These specs exercise the
 * resolution logic itself, so they mock the peer with a unique sentinel and
 * load a *fresh* copy of `dependencies.ts` per test — its resolved instance is
 * a module-level singleton, and a test that inherited the previous one would
 * assert against the wrong sentinel.
 *
 * `vi.resetModules()` cannot deliver that here: the browser runner evaluates
 * modules in the page's own registry, which no runner API can clear, so the
 * call returns the identical namespace object. A distinct query string is a
 * distinct module URL, which is a genuinely fresh evaluation — and it still
 * goes through Vite's transform, so the `vi.mock()` call above still applies.
 */
const importedMotion = { animate: () => {} };

vi.mock('motion', () => importedMotion);

let generation = 0;

function freshDependencies(): Promise<typeof import('@studiometa/ui-motion/dependencies')> {
  generation += 1;
  return import(/* @vite-ignore */ `../../ui-motion/src/dependencies.ts?fresh=${generation}`);
}

describe('ui-motion dependency injection', () => {

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
