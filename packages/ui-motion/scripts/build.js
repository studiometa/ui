import fs from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import { build as tsdownBuild } from 'tsdown';

function resolve(path, origin = import.meta.url) {
  return fileURLToPath(new URL(path, origin));
}

const srcDir = resolve('../src');
const outDir = resolve('../dist');

// Every `.ts` module under `src/`. `unbundle` keeps the emitted `dist/` tree
// one-to-one with these sources (e.g. `src/Motion.ts` → `dist/Motion.js`).
const entryPoints = glob.sync(['**/*.ts', '!**/node_modules/**'], {
  cwd: srcDir,
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
  console.log('Done!');
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

build();
