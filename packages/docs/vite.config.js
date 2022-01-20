// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';
import { resolve } from 'path';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';

const config = defineConfig({
  plugins: [
    Components({
      resolvers: IconsResolver(),
    }),
    Icons({ autoInstall: true }),
  ],
  optimizeDeps: {
    include: ['@studiometa/ui'],
  },
  resolve: {
    alias: {
      './NavBarTitle.vue': resolve('.vitepress/theme/components/NavBarTitle.vue'),
    },
  },
});

export default config;
