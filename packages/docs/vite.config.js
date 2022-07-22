// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'vite';
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';

/**
 * Import match as plain text.
 * @param   {RegExp} match
 * @returns {Plugin}
 */
function plainText(match) {
  return {
    name: 'plain text',
    transform(code, id) {
      if (
        (typeof match === 'string' && new RegExp(match).test(id)) ||
        (match instanceof RegExp && match.test(id)) ||
        (typeof match === 'function' && match.call(this, code, id))
      ) {
        return `export default ${JSON.stringify(code)}`;
      }

      return code;
    },
  };
}

const config = defineConfig({
  plugins: [
    plainText(/\.twig$/),
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
      allow: ['../../..'],
    },
  },
  optimizeDeps: {
    include: ['@studiometa/js-toolkit'],
    exclude: ['@studiometa/ui'],
  },
  resolve: {
    alias: {
      './VPNavBarTitle.vue': resolve('.vitepress/theme/components/NavBarTitle.vue'),
      './VPNavBarSearch.vue': resolve('.vitepress/theme/components/SearchBtn.vue'),
      './VPSidebarLink.vue': resolve('.vitepress/theme/components/SidebarLink.vue'),
    },
  },
});

export default config;
