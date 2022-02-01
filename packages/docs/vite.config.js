// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';
import { writeFileSync } from 'fs';
import { resolve, join } from 'path';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';

const config = defineConfig({
  plugins: [
    Components({
      resolvers: IconsResolver(),
    }),
    Icons({ autoInstall: true }),
    {
      name: 'add-common-js-package-plugin',
      writeBundle(viteConfig) {
        if (viteConfig.format === 'cjs' && viteConfig.esModule) {
          writeFileSync(join(viteConfig.dir, 'package.json'), JSON.stringify({ type: 'commonjs' }));
        }
      },
    },
  ],
  server: {
    watch: {
      ignored: ['!**/node_modules/@studiometa/ui/**'],
    },
    fs: {
      allow: ['../../..']
    }
  },
  optimizeDeps: {
    include: ['@studiometa/js-toolkit'],
    exclude: ['@studiometa/ui'],
  },
  resolve: {
    alias: {
      './NavBarTitle.vue': resolve('.vitepress/theme/components/NavBarTitle.vue'),
    },
  },
});

export default config;
