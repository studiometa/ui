import { resolve } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import 'vitest/config';

const packagesRoot = resolve(import.meta.dirname, '..');

/**
 * These four specs read the repository rather than the DOM — the TypeScript
 * compiler API, `node:fs`, `node:child_process`, `import.meta.resolve` — so
 * they are the one part of the suite that cannot run in a browser and get a
 * Node project of their own.
 *
 * The line is drawn by what a spec imports, not by what it is about. Importing
 * `@studiometa/ui` registers every component, and registration needs a
 * `MutationObserver`, so a spec that loads the barrel cannot run under Node at
 * all. Three files that asserted both halves are split along that line, with
 * the repository half named `*-resolution` / `*-freshness`.
 */
const staticAnalysisSpecs = [
  'barrel-exports/barrel-exports.spec.ts',
  'autoload/manifest-freshness.spec.ts',
  'subpath-exports/resolution.spec.ts',
  'subpath-exports/backward-compat-resolution.spec.ts',
];

// `@studiometa/ui` and `@studiometa/ui-mapbox` publish their built `dist/`, but their `exports`
// maps also expose a `typescript` condition pointing at the `.ts` sources under `src/`. Activate
// it so in-repo tests run against source without a build step; keep the standard conditions after
// it so every other dependency resolves normally.
const sourceCondition = 'typescript';

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          conditions: [sourceCondition, 'browser', 'import', 'module', 'default'],
        },
        // The dependency scanner crawls every spec's import graph up front, so
        // a single unresolvable subpath aborts the whole run before one test
        // collects. Skipping discovery keeps a resolve failure inside the spec
        // that owns it.
        optimizeDeps: { noDiscovery: true, include: [] },
        server: {
          // The sources under test live in sibling packages, outside the Vite root.
          fs: { allow: [packagesRoot] },
        },
        test: {
          name: 'chromium',
          retry: 3,
          exclude: [...staticAnalysisSpecs, '**/node_modules/**'],
          // These components ask the platform questions no DOM emulation
          // answers: `IntersectionObserver`, layout geometry, computed styles,
          // `document.location`, and the browser globals
          // `@studiometa/js-toolkit` is entitled to use — `reportError()` among
          // them. Run them in the browser they target.
          //
          // The root stays on this package. Pointing it at `packages/` instead
          // — which is what the happy-dom config did, harmlessly, because Node
          // needs no dev server — makes Vite serve and crawl the whole
          // monorepo, and the run hangs before the first test collects.
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: 'chromium' }],
          },
          alias: {
            '^#private/(.*)': `${packagesRoot}/ui/src/$1`,
          },
          setupFiles: ['./__utils__/dev.ts', './__utils__/teardown.ts'],
        },
      },
      {
        // No `typescript` condition here, deliberately. Nothing in this project
        // imports a package under test — that is the whole reason these four
        // specs are separated — and two of them assert where the *published*
        // `exports` map points, which the source condition would answer with
        // `src/` and hide.
        test: {
          name: 'node',
          environment: 'node',
          include: staticAnalysisSpecs,
          alias: {
            '^#private/(.*)': `${packagesRoot}/ui/src/$1`,
          },
          setupFiles: ['./__utils__/dev.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['../ui/src/**/*.ts', '../ui-mapbox/src/**/*.ts', '../ui-motion/src/**/*.ts'],
      exclude: [
        '**/tests/**/*.ts',
        '**/ui/src/**/index.ts',
        '**/ui-mapbox/src/**/index.ts',
        '**/ui-motion/src/**/index.ts',
        '**/ui/src/catalog.ts',
        '**/ui/src/manifest.ts',
        '**/ui-mapbox/src/catalog.ts',
        '**/ui-mapbox/src/manifest.ts',
        '**/ui-motion/src/catalog.ts',
        '**/ui-motion/src/manifest.ts',
      ],
    },
  },
});
