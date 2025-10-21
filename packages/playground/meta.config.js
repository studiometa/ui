import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { playgroundPreset as playground, defineWebpackConfig } from '@studiometa/playground/preset';
import CopyPlugin from 'copy-webpack-plugin';
import esbuild from 'esbuild';

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
      loaders: {
        html: resolve('./lib/twig-loader.js'),
      },
      importMap: {
        '@motionone/easing': '/-/play/static/motionone-easing.js',
        '@studiometa/js-toolkit': '/-/play/static/js-toolkit/index.js',
        '@studiometa/js-toolkit/utils': '/-/play/static/js-toolkit/utils/index.js',
        '@studiometa/ui': '/-/play/static/ui/index.js',
        deepmerge: '/-/play/static/deepmerge.js',
        morphdom: '/-/play/static/morphdom.js',
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
    config.output.publicPath = '/-/play/';
    config.output.path = resolve('../docs/public/play/');

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from:
              dirname(fileURLToPath(import.meta.resolve('@studiometa/js-toolkit'))) +
              '/**/*.{js,ts}',
            context: dirname(fileURLToPath(import.meta.resolve('@studiometa/js-toolkit'))),
            to: join(config.output.path, 'static/js-toolkit/[path][name][ext]'),
            toType: 'template',
            info: {
              minimized: true,
            },
          },
          {
            from: './static/*.js',
            to: config.output.path,
            info: { minimized: true },
            transform: {
              async transformer(content, filename) {
                const result = await esbuild.build({
                  bundle: true,
                  target: 'es2022',
                  write: false,
                  format: 'esm',
                  sourcemap: true,
                  minify: false,
                  loader: {
                    '.ts': 'ts',
                  },
                  stdin: {
                    contents: content,
                    sourcefile: filename,
                    resolveDir: config.context,
                  },
                });
                return result.outputFiles.at(0).text;
              },
              cache: true,
            },
          },
          {
            from: '../ui/**/*.ts',
            to: join(config.output.path, 'static/ui/[path][name].js'),
            toType: 'template',
            info: { minimized: true },
            transform: {
              async transformer(content, filename) {
                const result = await esbuild.build({
                  target: 'es2022',
                  write: false,
                  format: 'esm',
                  sourcemap: true,
                  minify: false,
                  stdin: {
                    contents: content,
                    sourcefile: filename,
                    resolveDir: dirname(filename),
                    loader: 'ts',
                  },
                });
                return result.outputFiles.at(0).text;
              },
              cache: true,
            },
          },
        ],
      }),
    );

    config.optimization.splitChunks.cacheGroups = {
      vendors: {
        test: /[\\/]node_modules[\\/](?!.*\.css$)/,
        name: 'vendors',
        chunks: 'initial',
      },
    };
  },
});
