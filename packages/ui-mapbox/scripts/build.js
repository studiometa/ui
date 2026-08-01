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
 * - a `package.json` derived from the source one, with the entrypoints and
 *   `exports` map rewritten to point at the emitted `.js`/`.d.ts` files
 *   (the source ones resolve to `.ts` for in-repo consumption);
 * - the `README.md` and `LICENSE`/`LICENSE.md`, copied from the package root
 *   when available or from the repository root otherwise.
 */
function writePublishedFiles() {
  console.log('Writing dist/package.json...');
  const pkg = JSON.parse(fs.readFileSync(resolve('../package.json'), 'utf8'));

  // The published package sits at the `dist/` root and ships built `.js`
  // modules alongside their `.d.ts` type declarations. Point the entrypoints
  // and the per-component subpaths at those artefacts instead of the `.ts`
  // sources used when consuming the package from within the monorepo.
  pkg.main = 'index.js';
  pkg.types = 'index.d.ts';
  pkg.exports = {
    '.': { types: './index.d.ts', import: './index.js' },
    './*': { types: './*.d.ts', import: './*.js' },
  };

  fs.writeFileSync(resolve('../dist/package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

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
