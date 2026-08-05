import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { playgroundPreset as playground, defineWebpackConfig } from '@studiometa/playground/preset';

/**
 * Build playground dependency configs for a workspace package from its `package.json` `exports`
 * map, so its barrel and subpaths bundle from LOCAL source (tsdown) instead of being hardcoded.
 * This is what lets the `@studiometa/ui-autoload` side-effect entries (`./ui`, `./ui-mapbox`) and the
 * per-package `manifest` modules they pull resolve from the working tree while developing new components.
 *
 * `relDir` is relative to this config (e.g. `'../ui'`). `include`, when given, restricts the SUBpaths
 * to that list (the barrel `.` is always emitted). It exists for `@studiometa/ui`, whose ~190
 * component subpaths are NOT needed here — the manifest lazy-loads them as relative chunks of its own
 * bundle — and each would otherwise be a separate tsdown build. Generic all-subpath bundling in one
 * multi-entry build belongs upstream in @studiometa/playground; this per-package loop is the starter.
 */
function packageDeps(specifier, relDir, { include } = {}) {
  const { exports = {} } = JSON.parse(readFileSync(resolve(`${relDir}/package.json`), 'utf8'));
  const source = `${relDir}/**/*.ts`;
  const seen = new Set();
  const deps = [];
  for (const [key, target] of Object.entries(exports)) {
    if (key === './package.json' || key.includes('*') || typeof target !== 'string') continue;
    if (key.endsWith('.js') && key !== '.') continue; // skip the `.js` alias of a subpath
    const subpath = key === '.' ? '' : key.slice(1); // '.' → barrel, './manifest' → '/manifest'
    if (include && key !== '.' && !include.includes(subpath)) continue;
    if (seen.has(subpath)) continue;
    seen.add(subpath);
    deps.push({
      specifier: `${specifier}${subpath}`,
      source,
      entry: `${relDir}/${target.replace(/^\.\//, '')}`,
    });
  }
  return deps;
}

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
      // The workspace packages (ui, ui-mapbox, ui-autoload) are bundled from LOCAL source with
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
        '@studiometa/js-toolkit',
        '@studiometa/js-toolkit/utils',
        // Workspace packages bundled from local source, derived from each package's `exports` map.
        // ui / ui-mapbox contribute their barrel + `./manifest`; ui-autoload its barrel + the
        // `./ui`/`./ui-mapbox` side-effect entries — the subpaths the autoload lazy-import chain
        // needs. The manifests code-split (their `load: () => import(...)` calls), which requires
        // `@studiometa/playground` >= 0.3.11 (its `PlaygroundDependenciesPlugin` preserves per-chunk
        // filenames instead of flattening them to `index.js`). ui's ~190 component subpaths are NOT
        // listed: the manifest bundle lazy-loads them as its own chunks, so no separate entry is needed.
        ...packageDeps('@studiometa/ui', '../ui', { include: ['/manifest'] }),
        ...packageDeps('@studiometa/ui-mapbox', '../ui-mapbox', { include: ['/manifest'] }),
        ...packageDeps('@studiometa/ui-autoload', '../ui-autoload', { include: ['/ui', '/ui-mapbox'] }),
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
