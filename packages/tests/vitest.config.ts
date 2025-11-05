import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '..',
    retry: 3,
    environment: 'happy-dom',
    alias: {
      '^#private/(.*)': '../ui/$1',
    },
    setupFiles: ['./tests/__utils__/happydom.ts'],
    coverage: {
      provider: 'v8',
      include: ['ui/**/*.ts'],
      exclude: ['**/tests/**/*.ts', '**/ui/**/index.ts'],
    },
    exclude: ['**/.symfony/vendor/**'],
  },
});
