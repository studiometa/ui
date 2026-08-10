import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '..',
    retry: 3,
    environment: 'happy-dom',
    alias: {
      '^#private/(.*)': '../ui/$1',
      // `@studiometa/ui-mapbox` publishes its built `dist/`, but in-repo tests
      // run against the `.ts` sources under `src/` — resolve the barrel and its
      // subpaths there instead of the unbuilt `dist/`.
      '^@studiometa/ui-mapbox$': '../ui-mapbox/src/index.ts',
      '^@studiometa/ui-mapbox/(.*)$': '../ui-mapbox/src/$1.ts',
    },
    setupFiles: ['./tests/__utils__/dev.ts', './tests/__utils__/happydom.ts'],
    coverage: {
      provider: 'v8',
      include: ['ui/**/*.ts', 'ui-mapbox/src/**/*.ts'],
      exclude: [
        '**/tests/**/*.ts',
        '**/ui/**/index.ts',
        '**/ui-mapbox/src/**/index.ts',
        '**/ui/catalog.ts',
        '**/ui/manifest.ts',
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
