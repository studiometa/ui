import { resolve } from 'node:path';
import { playgroundPreset as playground, defineWebpackConfig } from '@studiometa/playground/preset';

const CDN_BASE_URL = 'https://cdn.studiometa.dev';
// The exact published version of this repo (e.g. `1.10.0-beta.1`). ui/ui-mapbox are pinned to it
// on the CDN rather than the mutable `@main` alias: `@main` 307-redirects to the immutable
// `main-<sha>` channel, and modern-monaco's TypeScript LSP cannot resolve `.d.ts` through a
// redirect (its `resolveModuleNameLiterals` skips the `x-typescript-types` header on a redirected
// response), so an exact, non-redirecting URL is required for editor autocomplete to work.
// Upstream fix: https://github.com/esm-dev/modern-monaco/pull/64 (issue #63). Once it is merged
// and released — and the modern-monaco version the playground loads is bumped past it — revert
// `@studiometa/ui`/`ui-mapbox` below to the rolling `@main` alias.
const UI_VERSION = process.env.npm_package_version;

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
      dependencies: [
        '@motionone/easing',
        'compute-scroll-into-view',
        'deepmerge',
        'morphdom',
        // Consumer-provided peers that the ui-mapbox CDN tree externalizes, so
        // they still need to be resolved for the script editor.
        { specifier: 'mapbox-gl', esmSh: { bundle: true } },
        { specifier: '@mapbox/mapbox-gl-geocoder', esmSh: { bundle: true } },
      ],
      // Point js-toolkit, ui and ui-mapbox at the live studiometa CDN instead of
      // esm.sh / local tsdown source-bundles. The CDN serves `.d.ts` + an
      // `X-TypeScript-Types` header, so the editor keeps TypeScript autocomplete.
      // js-toolkit MUST match the exact `/js-toolkit@3.8.0/index.js` URL the ui
      // build bakes in as an absolute CDN import, so both share a single runtime.
      importMap: {
        '@studiometa/js-toolkit': `${CDN_BASE_URL}/js-toolkit@3.8.0/index.js`,
        '@studiometa/js-toolkit/utils': `${CDN_BASE_URL}/js-toolkit@3.8.0/utils/index.js`,
        // Pinned to the exact repo version (non-redirecting) so modern-monaco's LSP resolves
        // their `.d.ts`; it tracks releases as the version bumps land, and that version must be
        // published to the CDN (it is, via the release `cdn_release` job).
        '@studiometa/ui': `${CDN_BASE_URL}/ui@${UI_VERSION}/index.js`,
        '@studiometa/ui-mapbox': `${CDN_BASE_URL}/ui-mapbox@${UI_VERSION}/index.js`,
      },
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
