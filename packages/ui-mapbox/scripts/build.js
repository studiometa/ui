import fs from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import { build as tsdownBuild } from 'tsdown';

function resolve(path, origin = import.meta.url) {
  return fileURLToPath(new URL(path, origin));
}

const root = resolve('../');
const outDir = resolve('../dist');

// Mirror the previous esbuild entry set: every `.ts` module at the package root,
// excluding the build scripts, the emitted `dist/` and dependencies. `unbundle`
// keeps the output tree one-to-one with these sources.
const entryPoints = glob.sync(['**/*.ts', '!scripts/**', '!dist/**', '!**/node_modules/**'], {
  cwd: root,
  absolute: true,
});

// Every non-relative, non-absolute specifier stays external, mirroring the
// transpile-only esbuild build that never bundled a bare import.
const isExternal = (id) => !id.startsWith('.') && !isAbsolute(id);

async function build() {
  console.log('Building esm...');
  // tsdown (rolldown) replaces the former esbuild + `tsgo` split, emitting the
  // JavaScript modules and their `.d.ts` declarations. The two are emitted by
  // separate passes: a single mixed pass would let the JavaScript source maps
  // leak `//# sourceMappingURL` comments into the declarations (the dts plugin
  // forces the dts output map from the shared `sourcemap` option, then deletes
  // the map, leaving a dangling reference). This mirrors the `@studiometa/ui`
  // build (see `scripts/shared.js`).
  const shared = {
    entry: entryPoints,
    outDir,
    format: 'esm',
    platform: 'neutral',
    target: 'esnext',
    unbundle: true,
    config: false,
    external: isExternal,
    tsconfig: resolve('../tsconfig.build.json'),
    logLevel: 'silent',
  };
  await tsdownBuild({ ...shared, sourcemap: true, dts: false, clean: true });
  await tsdownBuild({ ...shared, sourcemap: false, dts: { emitDtsOnly: true }, clean: false });
  console.log('Done building esm!');

  synthesizeFacadeSourceMaps(outDir);
  writePublishedFiles();
}

/**
 * Rolldown emits no source map for a pure re-export facade entry; synthesize the
 * empty map so every emitted `.js` keeps a sibling `.map`, matching the shape
 * esbuild produced.
 *
 * @param   {string} directory
 * @returns {void}
 */
function synthesizeFacadeSourceMaps(directory) {
  const files = listFiles(directory);
  const present = new Set(files);
  for (const file of files) {
    if (!file.endsWith('.js') || present.has(`${file}.map`)) continue;
    const absolute = `${directory}/${file}`;
    const base = file.split('/').pop();
    const map = {
      version: 3,
      file: base,
      sources: [],
      sourcesContent: [],
      names: [],
      mappings: '',
    };
    fs.writeFileSync(`${absolute}.map`, `${JSON.stringify(map)}\n`);
    let source = fs.readFileSync(absolute, 'utf8');
    if (!source.includes('# sourceMappingURL=')) {
      source = `${source.replace(/\s+$/, '')}\n//# sourceMappingURL=${base}.map\n`;
      fs.writeFileSync(absolute, source);
    }
  }
}

/**
 * List every file below `dir`, returned as paths relative to `dir`.
 *
 * @param   {string} dir
 * @param   {string} base
 * @returns {string[]}
 */
function listFiles(dir, base = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...listFiles(path, base));
    else files.push(path.slice(base.length + 1));
  }
  return files;
}

/**
 * List the modules re-exported by the package `index.ts`.
 *
 * The barrel re-exports each public module via `export … from './File.js'`
 * specifiers (`export *`, `export { … }`, `export type { … }`). This parses
 * those specifiers to recover the exact set of publicly exported files, each of
 * which gets its own explicit `exports` key so it resolves to the module itself
 * rather than being swallowed by the greedy `./*` wildcard used for deep-file
 * imports. Files not re-exported there stay internal and get no subpath.
 *
 * @returns {string[]}
 */
function listReexportedFiles() {
  const source = fs.readFileSync(resolve('../index.ts'), 'utf8');
  const files = new Set();
  const re = /from\s+['"]\.\/([^'"]+?)(?:\.js)?['"]/g;
  let match;
  while ((match = re.exec(source))) {
    files.add(match[1]);
  }
  return [...files].sort();
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
    // The `./autoload` side-effect entry registers the manifest with the js-toolkit autoload
    // runtime. It is an explicit public entry, so it gets its own key rather than relying on the
    // greedy `./*` wildcard.
    './autoload': { types: './autoload.d.ts', import: './autoload.js' },
    './manifest': { types: './manifest.d.ts', import: './manifest.js' },
  };

  // One explicit flat subpath per module re-exported by `index.ts`, mirroring
  // the source `exports` map but pointing at the emitted `.js`/`.d.ts` artefacts.
  for (const file of listReexportedFiles()) {
    pkg.exports[`./${file}`] = { types: `./${file}.d.ts`, import: `./${file}.js` };
  }

  // Greedy wildcard for deep-file imports not covered by an explicit key above.
  pkg.exports['./*'] = { types: './*.d.ts', import: './*.js' };

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
