import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { playgroundPreset as playground, defineWebpackConfig } from '@studiometa/playground/preset';
import CopyPlugin from 'copy-webpack-plugin';
import esbuild from 'esbuild';

const require = createRequire(import.meta.url);
const tsgoPackageDir = dirname(require.resolve('@typescript/native-preview/package.json'));
const { default: getExePath } = await import(pathToFileURL(join(tsgoPackageDir, 'lib/getExePath.js')));
const tsgo = getExePath();

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
      importMap: {
        '@motionone/easing': '/play/static/motionone-easing.js',
        '@studiometa/js-toolkit': '/play/static/js-toolkit/index.js',
        '@studiometa/js-toolkit/utils': '/play/static/js-toolkit/utils/index.js',
        '@studiometa/ui': '/play/static/ui/index.js',
        deepmerge: '/play/static/deepmerge.js',
        morphdom: '/play/static/morphdom.js',
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

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from:
              dirname(fileURLToPath(import.meta.resolve('@studiometa/js-toolkit'))) +
              '/**/*.{js,ts,map}',
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

    // Generate .d.ts files for @studiometa/ui using tsgo
    const dtsOutDir = join(config.output.path, 'static/ui');
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.afterEmit.tapPromise('TsgoDtsPlugin', async () => {
          execFileSync(tsgo, [
            '--declaration',
            '--emitDeclarationOnly',
            '--noCheck',
            '--outDir', dtsOutDir,
            '--moduleResolution', 'node',
            '--target', 'esnext',
            '--module', 'esnext',
            '--skipLibCheck',
            resolve('../ui/index.ts'),
          ], { stdio: 'ignore' });

          // Rewrite .js imports to .d.ts in declaration files so that
          // modern-monaco's TypeScript worker resolves types correctly
          // when fetching .d.ts files over HTTP.
          const rewriteDtsImports = async (dir) => {
            const entries = await readdir(dir, { withFileTypes: true });
            await Promise.all(entries.map(async (entry) => {
              const fullPath = join(dir, entry.name);
              if (entry.isDirectory()) {
                return rewriteDtsImports(fullPath);
              }
              if (entry.name.endsWith('.d.ts')) {
                const content = await readFile(fullPath, 'utf8');
                const rewritten = content.replace(
                  /(from\s+['"])([^'"]+)\.js(['"])/g,
                  '$1$2.d.ts$3',
                );
                if (rewritten !== content) {
                  await writeFile(fullPath, rewritten);
                }
              }
            }));
          };
          await rewriteDtsImports(dtsOutDir);
        });
      },
    });

    config.optimization.splitChunks.cacheGroups = {
      vendors: {
        test: /[\\/]node_modules[\\/](?!.*\.css$)/,
        name: 'vendors',
        chunks: 'initial',
      },
    };
  },
});
