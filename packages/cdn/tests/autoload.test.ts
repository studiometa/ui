import { Base } from '@studiometa/js-toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentManifestEntry } from '../src/manifest.js';

class AutoloadComponent extends Base {}

const runtimeKey = Symbol.for('@studiometa/ui-cdn/runtime');

function createDocument(...sources: string[]): Document {
  const documentObject = document.implementation.createHTMLDocument('CDN test');
  for (const source of sources) {
    const script = documentObject.createElement('script');
    script.type = 'module';
    script.dataset.studiometaUi = '';
    Object.defineProperty(script, 'src', { value: source, configurable: true });
    documentObject.head.append(script);
  }
  return documentObject;
}

function createManifest(load: () => Promise<typeof AutoloadComponent>) {
  return {
    Eager: {
      token: 'Eager',
      packageName: '@studiometa/ui',
      subpath: 'Eager',
      exportName: 'Eager',
      strategy: 'visible',
      group: 'test',
      load,
    },
  } satisfies Record<string, ComponentManifestEntry>;
}

async function settle(): Promise<void> {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  const script = document.createElement('script');
  script.type = 'module';
  script.dataset.studiometaUi = '';
  document.head.append(script);
});

afterEach(() => {
  const runtime = (globalThis as unknown as Record<PropertyKey, unknown>)[runtimeKey] as
    | { loader?: { stop: () => void } }
    | undefined;
  runtime?.loader?.stop();
  delete (globalThis as unknown as Record<PropertyKey, unknown>)[runtimeKey];
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('CDN autoload', () => {
  it('starts discovery without a marked script (e.g. imported from a module) and does not warn', async () => {
    const { startAutoload } = await import('../src/autoload.js');
    const logger = { warn: vi.fn(), error: vi.fn() };

    const runtime = startAutoload({
      document: createDocument(), // no data-studiometa-ui script, as when imported from JS
      globalObject: {},
      version: '1.2.3',
      manifest: {},
      loaderDependencies: {
        MutationObserver: undefined,
        registerComponent: vi.fn(async () => []),
        console: logger,
      },
      console: logger,
    });

    expect(runtime).toMatchObject({ packageName: '@studiometa/ui-cdn', version: '1.2.3' });
    expect(logger.warn.mock.calls.flat().join(' ')).not.toContain('data-studiometa-ui');
  });

  it('warns and stops for repeated or conflicting marked scripts', async () => {
    const { startAutoload } = await import('../src/autoload.js');
    const logger = { warn: vi.fn() };

    expect(
      startAutoload({
        document: createDocument('https://cdn.test/ui.js', 'https://cdn.test/ui.js'),
        globalObject: {},
        console: logger,
      }),
    ).toBeUndefined();
    expect(
      startAutoload({
        document: createDocument('https://cdn.test/v1.js', 'https://cdn.test/v2.js'),
        globalObject: {},
        console: logger,
      }),
    ).toBeUndefined();

    expect(logger.warn.mock.calls.map(([message]) => message)).toEqual([
      '[@studiometa/ui-cdn] Repeated data-studiometa-ui scripts were found; loading stopped.',
      '[@studiometa/ui-cdn] Conflicting data-studiometa-ui scripts were found; loading stopped.',
    ]);
  });

  it('claims one stable runtime for repeated versions and rejects conflicting versions', async () => {
    const { startAutoload } = await import('../src/autoload.js');
    const logger = { warn: vi.fn(), error: vi.fn() };
    const globalObject = {};
    const documentObject = createDocument('https://cdn.test/ui.js');
    const dependencies = {
      MutationObserver: undefined,
      registerComponent: vi.fn(async () => []),
      console: logger,
    };

    const first = startAutoload({
      document: documentObject,
      globalObject,
      version: '1.2.3',
      manifest: {},
      loaderDependencies: dependencies,
      console: logger,
    });
    const repeated = startAutoload({
      document: documentObject,
      globalObject,
      version: '1.2.3',
      manifest: {},
      loaderDependencies: dependencies,
      console: logger,
    });
    const conflict = startAutoload({
      document: documentObject,
      globalObject,
      version: '2.0.0',
      manifest: {},
      loaderDependencies: dependencies,
      console: logger,
    });

    expect(first).toMatchObject({ packageName: '@studiometa/ui-cdn', version: '1.2.3' });
    expect(repeated).toBe(first);
    expect(conflict).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      '[@studiometa/ui-cdn] Version 1.2.3 is already active; the repeated script was ignored.',
    );
    expect(logger.warn).toHaveBeenCalledWith(
      '[@studiometa/ui-cdn] A conflicting CDN runtime version is already active; loading stopped.',
    );
  });

  it('parses, trims, and deduplicates URL eager components without DOM declarations', async () => {
    const { startAutoload } = await import('../src/autoload.js');
    const load = vi.fn(async () => AutoloadComponent);
    const register = vi.fn(async () => []);
    const logger = { warn: vi.fn(), error: vi.fn() };
    const documentObject = createDocument(
      'https://cdn.test/ui.js?components=%20Eager%20,Unknown,Eager&components=Eager',
    );

    startAutoload({
      document: documentObject,
      globalObject: {},
      version: 'test',
      manifest: createManifest(load),
      loaderDependencies: {
        MutationObserver: undefined,
        IntersectionObserver: undefined,
        registerComponent: register,
        console: logger,
      },
      console: logger,
    });
    await settle();

    expect(load).toHaveBeenCalledOnce();
    expect(register).toHaveBeenCalledWith(AutoloadComponent, 'Eager');
    expect(logger.warn).toHaveBeenCalledWith(
      '[@studiometa/ui-cdn] An unknown eager component was ignored.',
    );
    expect(logger.warn.mock.calls.flat().join(' ')).not.toContain('Unknown');
  });
});
