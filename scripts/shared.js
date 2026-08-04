import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import glob from 'fast-glob';
import { build as tsdownBuild } from 'tsdown';

export const resolve = (path, origin = import.meta.url) => fileURLToPath(new URL(path, origin));

const repositoryRoot = resolve('../');

export const outdir = resolve('../dist');

// Mirror the previous esbuild entry set: every `.js`/`.ts` module under
// `packages/ui`, excluding dependencies. `unbundle` keeps the output tree
// one-to-one with these sources.
const entryPoints = glob.sync(
  ['packages/ui/**/*.js', 'packages/ui/**/*.ts', '!**/node_modules/**'],
  { cwd: repositoryRoot, absolute: true },
);

// Every non-relative, non-absolute specifier stays external, mirroring the
// transpile-only esbuild build that never bundled a bare import (e.g.
// `@studiometa/js-toolkit`, `geojson`).
export const isExternal = (id) => !id.startsWith('.') && !isAbsolute(id);

/**
 * List every file below `dir`, returned as paths relative to `dir`.
 *
 * @param   {string} dir
 * @param   {string} root
 * @returns {Promise<string[]>}
 */
async function listFiles(dir, root = dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await listFiles(path, root)));
    else files.push(path.slice(root.length + 1));
  }
  return files;
}

const defaultOptions = {
  entry: entryPoints,
  outDir: outdir,
  format: 'esm',
  platform: 'neutral',
  target: 'esnext',
  unbundle: true,
  config: false,
  external: isExternal,
  tsconfig: resolve('../tsconfig.build.json'),
  logLevel: 'silent',
};

/**
 * Rolldown emits no source map for a pure re-export facade entry (`export { … }`
 * only), the same shape esbuild emitted with an empty (`sources: []`) map.
 * Synthesize that empty, source-free map for every such `.js` so the public
 * "one source map per module" invariant still holds.
 *
 * @param   {string} directory
 * @returns {Promise<void>}
 */
export async function synthesizeFacadeSourceMaps(directory) {
  const files = await listFiles(directory);
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
    await writeFile(`${absolute}.map`, `${JSON.stringify(map)}\n`);
    let source = await readFile(absolute, 'utf8');
    if (!source.includes('# sourceMappingURL=')) {
      source = `${source.replace(/\s+$/, '')}\n//# sourceMappingURL=${base}.map\n`;
      await writeFile(absolute, source);
    }
  }
}

/**
 * Run one tsdown (rolldown) pass over the `@studiometa/ui` sources.
 *
 * The JavaScript modules and their `.d.ts` declarations are emitted by two
 * separate passes (see `buildLibrary`): a single mixed pass would let the
 * JavaScript source maps leak `//# sourceMappingURL` comments into the
 * declarations (rolldown-plugin-dts forces the dts output map from the shared
 * JavaScript `sourcemap` option, then deletes the map, leaving a dangling
 * reference). Keeping the passes separate mirrors `packages/cdn/scripts/build.ts`.
 *
 * @param   {import('tsdown').Options} opts
 * @returns {Promise<Awaited<ReturnType<typeof tsdownBuild>>>}
 */
export function build(opts = {}) {
  return tsdownBuild({
    ...defaultOptions,
    ...opts,
  });
}

/**
 * Build the `@studiometa/ui` sources into `outdir`: one pass for the JavaScript
 * modules and their source maps, one declarations-only pass for the `.d.ts`
 * files, then the synthesized facade source maps. Replaces the former esbuild +
 * `tsgo` split with a single tsdown-based bundler.
 *
 * @returns {Promise<void>}
 */
export async function buildLibrary() {
  console.log('Building esm...');
  await build({ sourcemap: true, dts: false, clean: true });
  await build({ sourcemap: false, dts: { emitDtsOnly: true }, clean: false });
  await synthesizeFacadeSourceMaps(outdir);
  console.log('Done building esm!');
}
