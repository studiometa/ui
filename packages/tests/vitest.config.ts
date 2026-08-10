import { defineConfig } from 'vitest/config';

export default defineConfig({
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
      include: ['ui/src/**/*.ts', 'ui-mapbox/src/**/*.ts'],
      exclude: [
        '**/tests/**/*.ts',
        '**/ui/src/**/index.ts',
        '**/ui-mapbox/src/**/index.ts',
        '**/ui/src/catalog.ts',
        '**/ui/src/manifest.ts',
        '**/ui-mapbox/src/catalog.ts',
        '**/ui-mapbox/src/manifest.ts',
      ],
    },
    // The CDN workspace has its own vitest config and dedicated CI jobs (cdn_unit / cdn_build /
    // cdn_browser); exclude it here so its tests are not also collected by this root run with the
    // wrong config and working directory.
    exclude: ['**/.symfony/vendor/**', '**/api/vendor/**', '**/cdn/**'],
  },
});
