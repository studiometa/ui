// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  optimizeDeps: {
    include: ['@studiometa/ui', '@studiometa/js-toolkit'],
  },
  resolve: {
    alias: {
      './NavBarTitle.vue': resolve('.vitepress/theme/components/NavBarTitle.vue'),
    },
  },
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['../..'],
    },
  },
});
