import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '..',
    retry: 3,
    environment: 'happy-dom',
    alias: {
      '^#private/(.*)': '../ui/$1',
    },
    setupFiles: ['./tests/__utils__/dev.ts', './tests/__utils__/happydom.ts'],
    coverage: {
      provider: 'v8',
      include: ['ui/**/*.ts', 'ui-mapbox/**/*.ts'],
      exclude: ['**/tests/**/*.ts', '**/ui/**/index.ts', '**/ui-mapbox/**/index.ts'],
    },
    exclude: ['**/.symfony/vendor/**', '**/api/vendor/**'],
  },
});
