import { describe, it, expect, vi } from 'vitest';

/**
 * Sentinels for the GSAP modules. These specs exercise the resolution logic
 * itself, so they load a fresh copy of `dependencies.ts` per test: its state
 * is module-level.
 *
 * `vi.resetModules()` cannot do that in the browser runner, which evaluates
 * modules in the page's own registry. A distinct query string is a distinct
 * module URL, so a fresh evaluation, and it still goes through the `vi.mock()`
 * calls below. The mocked GSAP modules are evaluated once for the whole file:
 * the factory counters tell when a module is first imported.
 */
const mocks = vi.hoisted(() => {
  const core = { registerPlugin: (..._plugins: unknown[]) => {} };
  const plugin = { name: 'ScrollTrigger' };
  return { core, plugin, coreImports: 0, scrollTriggerImports: 0 };
});

vi.mock('gsap', () => {
  mocks.coreImports += 1;
  return { gsap: mocks.core, default: mocks.core };
});

vi.mock('gsap/ScrollTrigger', () => {
  mocks.scrollTriggerImports += 1;
  // Only a default export: the module normalization reads both shapes.
  return { default: mocks.plugin };
});

let generation = 0;

function freshDependencies(): Promise<typeof import('@studiometa/ui-gsap/dependencies')> {
  generation += 1;
  return import(/* @vite-ignore */ `../../ui-gsap/src/dependencies.ts?fresh=${generation}`);
}

function fakeCore() {
  return { registerPlugin: vi.fn() } as never as typeof import('gsap').gsap & {
    registerPlugin: ReturnType<typeof vi.fn>;
  };
}

describe('ui-gsap dependency injection', () => {
  // This test runs first: it is the one that sees the first imports.
  it('imports the core on demand, and ScrollTrigger only when requested', async () => {
    const { resolveGsap, getGsap } = await freshDependencies();
    const registerPlugin = vi.spyOn(mocks.core, 'registerPlugin');
    expect(mocks.coreImports).toBe(0);

    const resolved = await resolveGsap();
    expect(resolved.gsap).toBe(mocks.core);
    expect(resolved.ScrollTrigger).toBeUndefined();
    expect(mocks.coreImports).toBe(1);
    expect(mocks.scrollTriggerImports).toBe(0);
    expect(getGsap()).toBe(resolved);

    const withPlugin = await resolveGsap({ scrollTrigger: true });
    expect(withPlugin.gsap).toBe(mocks.core);
    expect(withPlugin.ScrollTrigger).toBe(mocks.plugin);
    expect(mocks.scrollTriggerImports).toBe(1);
    expect(registerPlugin).toHaveBeenCalledExactlyOnceWith(mocks.plugin);

    // Memoized: no new import and no new registration.
    expect(await resolveGsap({ scrollTrigger: true })).toBe(withPlugin);
    expect(await resolveGsap()).toBe(withPlugin);
    expect(registerPlugin).toHaveBeenCalledOnce();
    expect(getGsap()).toBe(withPlugin);
    registerPlugin.mockRestore();
  });

  it('throws from getGsap before GSAP is resolved', async () => {
    const { getGsap } = await freshDependencies();
    expect(() => getGsap()).toThrow(/has not been resolved/);
  });

  it('prefers the injected modules and registers their plugin once', async () => {
    const { provideGsap, resolveGsap, getGsap } = await freshDependencies();
    const core = fakeCore();
    const plugin = {} as never;

    provideGsap({ gsap: core, ScrollTrigger: plugin });
    provideGsap({ gsap: core, ScrollTrigger: plugin });

    expect(getGsap()).toEqual({ gsap: core, ScrollTrigger: plugin });
    expect(await resolveGsap({ scrollTrigger: true })).toBe(getGsap());
    expect(core.registerPlugin).toHaveBeenCalledExactlyOnceWith(plugin);
  });

  it('lets an injection win over an import in progress', async () => {
    const { provideGsap, resolveGsap, getGsap } = await freshDependencies();
    const core = fakeCore();

    const pending = resolveGsap({ scrollTrigger: true });
    provideGsap({ gsap: core });

    expect((await pending).gsap).toBe(core);
    expect(getGsap().gsap).toBe(core);
    expect((await resolveGsap()).gsap).toBe(core);
  });

  it('never imports a plugin that the injection did not give', async () => {
    const { provideGsap, resolveGsap } = await freshDependencies();
    const core = fakeCore();
    const imports = mocks.scrollTriggerImports;

    provideGsap({ gsap: core });
    const resolved = await resolveGsap({ scrollTrigger: true });

    expect(resolved.ScrollTrigger).toBeUndefined();
    expect(mocks.scrollTriggerImports).toBe(imports);
    expect(core.registerPlugin).not.toHaveBeenCalled();
  });
});
