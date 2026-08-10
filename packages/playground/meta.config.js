import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { playgroundPreset as playground, defineWebpackConfig } from '@studiometa/playground/preset';

// `@studiometa/ui` and `@studiometa/ui-mapbox` publish their built `dist/`, so their `exports` maps
// point at `dist/*.js`. The playground bundles workspace packages from LOCAL SOURCE, so map every
// public subpath to its `.ts` module via the `typescript` export condition each package exposes
// (the same condition the tests and type-checker use) rather than letting the preset resolve the
// default `import`/`dist` target.
function sourceEntries(root) {
  const { exports } = JSON.parse(readFileSync(resolve(`${root}/package.json`), 'utf8'));
  return Object.fromEntries(
    Object.entries(exports)
      .filter(([key, value]) => key.startsWith('.') && !key.includes('*') && typeof value === 'object')
      .map(([key, value]) => [key, `${root}/${value.typescript.replace(/^\.\//, '')}`]),
  );
}

const uiEntries = sourceEntries('../ui');
const mapboxEntries = sourceEntries('../ui-mapbox');

export default defineWebpackConfig({
  presets: [
    playground({
      head: {
        title: 'Playground — @studiometa/ui',
      },
      header: {
        title: `
<span class="font-bold">Playground</span>
<span class="py-1 px-2 rounded bg-zinc-200 dark:bg-zinc-900 dark:bg-opacity-50">
  <span class="text-xs">v${process.env.npm_package_version}</span>
</span>
      `,
      },
      tailwindcss: true,
      syncColorScheme: true,
      htmlLanguage: { id: 'twig' },
      loaders: {
        html: resolve('./lib/twig-loader.js'),
      },
      // The workspace packages (ui, ui-mapbox) are bundled from LOCAL source with
      // tsdown so the playground reflects the current working tree — essential for developing and
      // testing new components/features before they are published. This also emits same-origin
      // `.d.ts` (+ `_headers` with `X-TypeScript-Types`), so the editor gets full types without the
      // cross-origin/redirect limitations of loading declarations from a remote CDN.
      //
      // js-toolkit is an external (non-workspace) dependency resolved from esm.sh with its default
      // bundling: sub-modules are inlined, so esm.sh never splits its barrels — which structurally
      // avoids the `export *`-from-externalized-module name-drop bug (also fixed at source in
      // js-toolkit 3.8.1). The singleton holds because js-toolkit's mutable state (the component
      // registry behind `createApp`) lives in its main entry (one resolved URL), and `/utils` is
      // stateless. The remaining entries are ui/ui-mapbox runtime peers the script editor needs.
      dependencies: [
        '@motionone/easing',
        'compute-scroll-into-view',
        'deepmerge',
        'morphdom',
        { specifier: 'mapbox-gl', esmSh: { bundle: true } },
        { specifier: '@mapbox/mapbox-gl-geocoder', esmSh: { bundle: true } },
        { specifier: '@studiometa/js-toolkit', subpaths: true },
        // Workspace packages bundled from local source so the playground reflects the working tree.
        // `subpaths: true` reads each package's `package.json` `exports` map and builds every subpath
        // as an entry of ONE code-split tsdown build (@studiometa/playground >= 0.3.12): modules shared
        // between entries — component classes referenced by both the barrel and the `./manifest` lazy
        // imports, or by a direct `@studiometa/ui/<Component>` import — are emitted once as a shared
        // chunk and referenced by every entry, so there is a single runtime instance (no singleton /
        // identity hazard). ui exposes its barrel + `./manifest` + `./autoload` + every component
        // subpath; ui-mapbox likewise exposes its barrel + `./manifest` + `./autoload`.
        { specifier: '@studiometa/ui', source: '../ui/src/**/*.ts', entries: uiEntries },
        { specifier: '@studiometa/ui-mapbox', source: '../ui-mapbox/src/**/*.ts', entries: mapboxEntries },
      ],
      defaults: {
        html: `{% html_element 'span' with { class: 'dark:text-white font-bold border-b-2 border-current' } %}
  Hello world
{% end_html_element %}`,
        style: `html.dark {
  background-color: #222;
  color: #eee;
}

body {
  padding: 1rem;
}`,
        script: `import { Base, createApp } from '@studiometa/js-toolkit';
import {} from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
  };
}

createApp(App);`,
      },
    }),
  ],
  webpack(config) {
    config.output.publicPath = '/play/';
    config.output.path = resolve('../docs/public/play/');

    config.optimization.splitChunks.cacheGroups = {
      vendors: {
        test: /[\\/]node_modules[\\/](?!.*\.css$)/,
        name: 'vendors',
        chunks: 'initial',
      },
    };
  },
});
