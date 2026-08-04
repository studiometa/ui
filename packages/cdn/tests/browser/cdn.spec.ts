import { expect, type Page } from '@playwright/test';
import {
  captureDiagnostics,
  expectMounted,
  expectNoBrowserErrors,
  test,
  type CdnServers,
} from './fixtures.js';

const RUNTIME_KEY = '@studiometa/ui-cdn/runtime';

function requestedPaths(cdn: CdnServers): string[] {
  return cdn.requests.map(({ pathname }) => pathname);
}

async function runtimeIsStable(page: Page, callback: () => Promise<void>): Promise<void> {
  const before = await page.evaluate((key) => {
    const runtime = (globalThis as Record<PropertyKey, unknown>)[Symbol.for(key)];
    (globalThis as Record<string, unknown>).__CDN_RUNTIME_BEFORE__ = runtime;
    return {
      instances: ((globalThis as Record<string, unknown>).__JS_TOOLKIT_INSTANCES__ as Set<unknown>)
        .size,
      registry: (
        (globalThis as Record<string, unknown>).__JS_TOOLKIT_REGISTRY__ as Map<unknown, unknown>
      ).size,
    };
  }, RUNTIME_KEY);

  await callback();

  expect(
    await page.evaluate((key) => {
      const scope = globalThis as Record<PropertyKey, unknown>;
      return {
        sameRuntime: scope[Symbol.for(key)] === scope.__CDN_RUNTIME_BEFORE__,
        instances: (scope.__JS_TOOLKIT_INSTANCES__ as Set<unknown>).size,
        registry: (scope.__JS_TOOLKIT_REGISTRY__ as Map<unknown, unknown>).size,
      };
    }, RUNTIME_KEY),
  ).toEqual({ sameRuntime: true, ...before });
}

async function addMarkedScript(page: Page, src: string): Promise<void> {
  await page.evaluate(async (source) => {
    await new Promise<void>((resolvePromise, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = source;
      script.dataset.studiometaUi = '';
      script.addEventListener('load', () => resolvePromise(), { once: true });
      script.addEventListener('error', () => reject(new Error(`Failed to load ${source}`)), {
        once: true,
      });
      document.head.append(script);
    });
  }, src);
}

test.beforeEach(async ({ cdn }) => {
  cdn.reset();
});

test('cross-origin marked module mounts Action without authored registration', async ({
  page,
  cdn,
}) => {
  const diagnostics = captureDiagnostics(page);
  await page.goto(
    cdn.fixtureUrl({
      body: '<button id="action" data-component="Action" data-on:click="$el.textContent = \'Mounted\'">Run</button>',
    }),
  );

  await expectMounted(page, '#action', 'Action');
  await page.locator('#action').click();
  await expect(page.locator('#action')).toHaveText('Mounted');

  expect(new URL(page.url()).origin).not.toBe(cdn.artifactOrigin);
  expect(requestedPaths(cdn)).toContain(
    new URL(cdn.exactUrl(cdn.build.entries.autoload.path)).pathname,
  );
  expect(requestedPaths(cdn)).toContain(
    new URL(cdn.exactUrl(cdn.build.components.Action.entry)).pathname,
  );
  expectNoBrowserErrors(diagnostics);
});

test('compound parent and children share one js-toolkit constructor identity', async ({
  page,
  cdn,
}) => {
  const diagnostics = captureDiagnostics(page);
  await page.goto(
    cdn.fixtureUrl({
      body: `
        <section id="accordion" data-component="Accordion">
          <article id="item" data-component="AccordionItem">
            <button data-ref="btn">Toggle</button>
            <div data-ref="container"><div data-ref="content">Content</div></div>
          </article>
        </section>`,
    }),
  );

  await expectMounted(page, '#accordion', 'Accordion');
  await expectMounted(page, '#item', 'AccordionItem');
  expect(
    await page.evaluate(() => {
      const parent = (
        document.querySelector('#accordion') as Element & { __base__: Map<string, unknown> }
      ).__base__.get('Accordion') as {
        constructor: {
          config: { components: { AccordionItem: unknown } };
          prototype: object;
        };
      };
      const child = (
        document.querySelector('#item') as Element & { __base__: Map<string, unknown> }
      ).__base__.get('AccordionItem') as { constructor: { prototype: object } };
      const registry = (globalThis as Record<string, unknown>).__JS_TOOLKIT_REGISTRY__ as Map<
        string,
        unknown
      >;
      const parentBase = Object.getPrototypeOf(
        Object.getPrototypeOf(parent.constructor.prototype),
      ).constructor;
      const childBase = Object.getPrototypeOf(child.constructor.prototype).constructor;
      return {
        configuredChildMatches:
          parent.constructor.config.components.AccordionItem === child.constructor,
        registeredChildMatches: registry.get('AccordionItem') === child.constructor,
        sharedBase: parentBase === childBase,
        runtimeCount: Number(
          Boolean(
            (globalThis as Record<PropertyKey, unknown>)[Symbol.for('@studiometa/ui-cdn/runtime')],
          ),
        ),
      };
    }),
  ).toEqual({
    configuredChildMatches: true,
    registeredChildMatches: true,
    sharedBase: true,
    runtimeCount: 1,
  });
  expectNoBrowserErrors(diagnostics);
});

test('dynamic roots mount and removed roots terminate through js-toolkit', async ({
  page,
  cdn,
}) => {
  const diagnostics = captureDiagnostics(page);
  await page.goto(cdn.fixtureUrl({ body: '' }));

  await page.evaluate(() => {
    const element = document.createElement('button');
    element.id = 'dynamic-action';
    element.dataset.component = 'Action';
    element.setAttribute('data-on:click', "$el.dataset.activated = 'true'");
    document.body.append(element);
  });
  await expectMounted(page, '#dynamic-action', 'Action');
  await page.locator('#dynamic-action').click();
  await expect(page.locator('#dynamic-action')).toHaveAttribute('data-activated', 'true');

  await page.evaluate(() => {
    const element = document.querySelector('#dynamic-action') as Element & {
      __base__: Map<string, unknown>;
    };
    (globalThis as Record<string, unknown>).__REMOVED_ACTION__ = element.__base__.get('Action');
    element.remove();
  });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const instance = (globalThis as Record<string, unknown>).__REMOVED_ACTION__ as {
          $el: Element & { __base__: Map<string, unknown> };
        };
        const instances = (globalThis as Record<string, unknown>)
          .__JS_TOOLKIT_INSTANCES__ as Set<unknown>;
        return {
          state: instance.$el.__base__.get('Action'),
          retained: instances.has(instance),
        };
      }),
    )
    .toEqual({ state: 'terminated', retained: false });
  expectNoBrowserErrors(diagnostics);
});

for (const [intent, token] of [
  ['pointerover', 'Action'],
  ['pointerdown', 'Target'],
  ['focusin', 'ClickOutside'],
] as const) {
  test(`${intent} starts an interaction-lazy fetch before activating click`, async ({
    page,
    cdn,
  }) => {
    const diagnostics = captureDiagnostics(page);
    const component = cdn.build.components[token];
    cdn.setDelay(component.entry, 250);
    await page.goto(
      cdn.fixtureUrl({
        body: `<button id="lazy" data-component="${token}" data-load="interaction">Load</button>`,
      }),
    );

    const entryPath = new URL(cdn.exactUrl(component.entry)).pathname;
    await page.waitForTimeout(100);
    expect(requestedPaths(cdn)).not.toContain(entryPath);
    await page.locator('#lazy').evaluate((element) => {
      element.addEventListener('click', () => {
        (globalThis as Record<string, unknown>).__ACTIVATED_AT__ = Date.now();
      });
    });
    await page.locator('#lazy').dispatchEvent(intent);
    await expect.poll(() => requestedPaths(cdn)).toContain(entryPath);
    expect(
      cdn.requests.find(({ pathname }) => pathname === entryPath)?.completedAt,
    ).toBeUndefined();

    await page.locator('#lazy').click();
    const activatedAt = await page.evaluate(
      () => (globalThis as unknown as { __ACTIVATED_AT__: number }).__ACTIVATED_AT__,
    );
    const request = cdn.requests.find(({ pathname }) => pathname === entryPath);
    expect(request?.requestedAt).toBeLessThanOrEqual(activatedAt);
    await expectMounted(page, '#lazy', token);
    await expect.poll(() => request?.durationMs).toBeGreaterThanOrEqual(200);
    expectNoBrowserErrors(diagnostics);
  });
}

test('alias redirects to an exact autoload base used by relative chunks', async ({ page, cdn }) => {
  const diagnostics = captureDiagnostics(page);
  await page.goto(
    cdn.fixtureUrl({
      body: '<div id="target" data-component="Target"></div>',
      script: 'alias',
    }),
  );
  await expectMounted(page, '#target', 'Target');

  const alias = cdn.requests.find(({ pathname }) => pathname === '/alias/main/autoload.js');
  const exactAutoloadPath = new URL(cdn.exactUrl(cdn.build.entries.autoload.path)).pathname;
  const exactComponentPath = new URL(cdn.exactUrl(cdn.build.components.Target.entry)).pathname;
  expect(alias?.status).toBe(307);
  expect(requestedPaths(cdn)).toContain(exactAutoloadPath);
  expect(requestedPaths(cdn)).toContain(exactComponentPath);
  expect(exactComponentPath).toContain(
    `/cdn/${encodeURIComponent(cdn.build.build.identifier).replaceAll('%2F', '/')}/`,
  );
  expectNoBrowserErrors(diagnostics);
});

test('duplicate and conflicting versions keep the first runtime and diagnose both', async ({
  page,
  cdn,
}) => {
  const diagnostics = captureDiagnostics(page);
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.goto(cdn.fixtureUrl({ body: '<div id="target" data-component="Target"></div>' }));
  await expectMounted(page, '#target', 'Target');

  await runtimeIsStable(page, async () => {
    await page.locator('script[data-studiometa-ui]').evaluate((script) => {
      script.removeAttribute('data-studiometa-ui');
    });
    await addMarkedScript(page, `${cdn.exactUrl(cdn.build.entries.autoload.path)}?duplicate=1`);
  });
  await expect
    .poll(() => warnings)
    .toContain(
      `[@studiometa/ui-cdn] Version ${cdn.build.package.version} is already active; the repeated script was ignored.`,
    );

  await runtimeIsStable(page, async () => {
    await page.locator('script[data-studiometa-ui]').evaluate((script) => {
      script.removeAttribute('data-studiometa-ui');
    });
    await addMarkedScript(page, cdn.exactUrl(cdn.build.entries.autoload.path, '0.0.0'));
  });
  await expect
    .poll(() => warnings)
    .toContain(
      '[@studiometa/ui-cdn] A conflicting CDN runtime version is already active; loading stopped.',
    );
  expectNoBrowserErrors(diagnostics);
});

test('public source maps are reachable cross-origin', async ({ page, cdn }) => {
  const diagnostics = captureDiagnostics(page);
  await page.goto(cdn.fixtureUrl({ body: '', script: 'none' }));
  // js-toolkit is externalized, so a component's entry chunk can be a thin re-export shim whose
  // map carries no original sources — the implementation (and its sources) lives in the shared
  // preload chunks. Assert every map in the component's graph plus the autoload entry map is
  // reachable and valid JSON, and that the graph as a whole is source-mapped (total sources > 0).
  const action = cdn.build.components.Action;
  const maps = [
    cdn.build.entries.autoload.sourceMap,
    `${action.entry}.map`,
    ...action.preload.map((chunk) => `${chunk}.map`),
  ];

  let totalSources = 0;
  for (const path of maps) {
    const result = await page.evaluate(async (url) => {
      const response = await fetch(url);
      const map = (await response.json()) as { sources: string[] };
      return {
        contentType: response.headers.get('content-type'),
        ok: response.ok,
        sources: map.sources.length,
      };
    }, cdn.exactUrl(path));
    expect(result).toMatchObject({ contentType: 'application/json; charset=utf-8', ok: true });
    totalSources += result.sources;
  }
  expect(totalSources).toBeGreaterThan(0);
  expectNoBrowserErrors(diagnostics);
});

function mapFixtureBody(): string {
  return `
    <div style="height: 2200px">Map below the fold</div>
    <div
      id="map"
      data-component="MapboxMap"
      data-load="visible"
      data-option-map-options='{"style":{"version":8,"sources":{},"layers":[]}}'
      style="width: 320px; height: 240px">
      <div data-ref="container" style="width: 320px; height: 240px"></div>
    </div>`;
}

test('Mapbox stays lazy until visible, then resolves mapbox-gl from the import map and mounts', async ({
  page,
  cdn,
}) => {
  const diagnostics = captureDiagnostics(page);
  // The CDN no longer bundles or serves mapbox-gl; the page provides it through an import map, just
  // like a real consumer would (here pointing at the fixture's stub instead of a real Mapbox build).
  await page.goto(cdn.fixtureUrl({ body: mapFixtureBody(), mapboxImportMap: true }));

  // MapboxMap now lives in its own first-class ui-mapbox tree and lazy-loads from its absolute
  // /ui-mapbox@<version>/ URL; nothing Mapbox is fetched until the map scrolls into view.
  const mapboxComponent = cdn.uiMapboxBuild.components.MapboxMap;
  const mapboxOnlyGraph = [mapboxComponent.entry, ...mapboxComponent.preload].map(
    (path) => new URL(cdn.uiMapboxUrl(path)).pathname,
  );
  await page.waitForTimeout(150);
  // The Mapbox component chunk is not fetched until the map scrolls into view.
  expect(requestedPaths(cdn).filter((path) => mapboxOnlyGraph.includes(path))).toEqual([]);

  await page.locator('#map').scrollIntoViewIfNeeded();
  await expect
    .poll(() => requestedPaths(cdn))
    .toContain(new URL(cdn.uiMapboxUrl(mapboxComponent.entry)).pathname);
  // The component resolved mapbox-gl from the import map (the stub) and mounted its map without any
  // bundled Mapbox chunk, worker or stylesheet.
  await expectMounted(page, '#map', 'MapboxMap');
  expectNoBrowserErrors(diagnostics);
});
