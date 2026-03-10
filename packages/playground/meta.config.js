import { resolve } from 'node:path';
import { playgroundPreset as playground, defineWebpackConfig } from '@studiometa/playground/preset';

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
        'deepmerge',
        { specifier: 'morphdom', source: 'morphdom' },
        { specifier: '@studiometa/js-toolkit', source: '@studiometa/js-toolkit' },
        {
          specifier: '@studiometa/ui',
          source: '../ui/**/*.ts',
          entry: '../ui/index.ts',
        },
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
