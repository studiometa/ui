import swc from '@rollup/plugin-swc';
import { defineConfig, withFilter } from 'vite';
import 'vitest/config';

/**
 * Stage-3 decorators are not lowered by Oxc, Vite's TypeScript transformer, and
 * no engine ships them yet, so they are compiled with SWC first. This is what
 * the Vite 8 migration guide documents, and the same plugin
 * `@studiometa/js-toolkit` uses for its own suite.
 *
 * The filter keeps the transform off everything with no decorator in it. A
 * `code: '@'` match alone is not enough: SWC parses whatever it is handed as
 * TypeScript, and an `.html` fixture holds an `@` of its own.
 */
function decorators() {
  return withFilter(
    swc({
      swc: {
        jsc: {
          parser: { syntax: 'typescript', decorators: true, decoratorsBeforeExport: true },
          transform: { decoratorVersion: '2023-11' },
        },
      },
    }),
    { transform: { id: /\.[cm]?[jt]sx?$/, code: '@' } },
  );
}

export default defineConfig({
  plugins: [decorators()],
  // `@studiometa/ui` and `@studiometa/ui-mapbox` publish their built `dist/`, but their `exports`
  // maps also expose a `typescript` condition pointing at the `.ts` sources under `src/`. Activate
  // it so in-repo tests run against source without a build step; keep the standard conditions after
  // it so every other dependency resolves normally.
  resolve: {
    conditions: ['typescript', 'browser', 'import', 'module', 'default'],
  },
  test: {
    root: '..',
    retry: 3,
    environment: 'happy-dom',
    alias: {
      '^#private/(.*)': '../ui/src/$1',
    },
    setupFiles: ['./tests/__utils__/dev.ts', './tests/__utils__/happydom.ts'],
    coverage: {
      provider: 'v8',
      include: ['ui/src/**/*.ts', 'ui-mapbox/src/**/*.ts', 'ui-motion/src/**/*.ts'],
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
    // The CDN workspace has its own vitest config and dedicated CI jobs (cdn_unit / cdn_build /
    // cdn_browser); exclude it here so its tests are not also collected by this root run with the
    // wrong config and working directory.
    exclude: ['**/.symfony/vendor/**', '**/api/vendor/**', '**/cdn/**'],
  },
});
