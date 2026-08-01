import fs from 'node:fs';
import glob from 'fast-glob';
import esbuild from 'esbuild';

function resolve(path, origin = import.meta.url) {
  return new URL(path, origin).pathname;
}

const root = resolve('../');

const entryPoints = glob.sync(['**/*.ts', '!scripts/**', '!dist/**', '!**/node_modules/**'], {
  cwd: root,
});

const outdir = resolve('../dist');

async function build() {
  console.log('Building esm...');
  const result = await esbuild.build({
    entryPoints: entryPoints.map((entry) => resolve(`../${entry}`)),
    write: true,
    outdir,
    outbase: root,
    format: 'esm',
    target: 'esnext',
    sourcemap: true,
  });

  result.errors.forEach((error) => console.error(error));
  result.warnings.forEach((warning) => console.warn(warning));
  console.log('Done building esm!');

  writePublishedFiles();
}

/**
 * Write the files consumed when publishing the `dist/` folder to NPM:
 *
 * - a `package.json` derived from the source one, with the `index.ts`
 *   entrypoints rewritten to the emitted `index.js` (mirrors the root
 *   `build:cp-files` script);
 * - the `README.md` and `LICENSE`/`LICENSE.md`, copied from the package root
 *   when available or from the repository root otherwise.
 */
function writePublishedFiles() {
  console.log('Writing dist/package.json...');
  const pkg = fs.readFileSync(resolve('../package.json'), 'utf8');
  fs.writeFileSync(resolve('../dist/package.json'), pkg.replaceAll('index.ts', 'index.js'));

  for (const file of ['README.md', 'LICENSE', 'LICENSE.md']) {
    const source = [resolve(`../${file}`), resolve(`../../../${file}`)].find((path) =>
      fs.existsSync(path),
    );
    if (source) {
      fs.copyFileSync(source, resolve(`../dist/${file}`));
    }
  }

  console.log('Done writing published files!');
}

build();
