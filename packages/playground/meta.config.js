import { resolve } from 'node:path';
import { playgroundPreset as playground, defineWebpackConfig } from '@studiometa/playground/preset';
import CopyPlugin from 'copy-webpack-plugin';
import esbuild from 'esbuild';

export default defineWebpackConfig({
  presets: [
    playground({
      head: {
        title: 'Playgound — @studiometa/ui',
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
      loaders: {
        html: resolve('./lib/twig-loader.js'),
      },
      importMap: {
        '@studiometa/js-toolkit/utils': '/-/play/static/js-toolkit-utils.js',
        '@studiometa/js-toolkit': '/-/play/static/js-toolkit.js',
        '@studiometa/ui': '/-/play/static/ui.js',
      },
      defaults: {
        html: `{% html_element 'span' with { class: 'dark:text-white font-bold border-b-2 border-current' } %}
  Hello world
{% end_html_element %}`,
        style: `html.dark {
  background-color: #222;
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
    config.output.publicPath = '/-/play/';
    config.output.path = resolve('../docs/public/play/');

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: './static/*.js',
            to: config.output.path,
            info: { minimized: true },
            async transform(content, filename) {
              const result = await esbuild.build({
                bundle: true,
                target: 'es2020',
                write: false,
                format: 'esm',
                sourcemap: true,
                minify: false,
                stdin: {
                  contents: content,
                  sourcefile: filename,
                  resolveDir: config.context,
                },
              });
              return result.outputFiles.at(0).text;
            },
          },
        ],
      }),
    );
  },
});
