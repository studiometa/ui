// Measure the published export sizes of the workspace packages, replacing the
// third-party export-size GitHub Action with a local check built on esbuild (the
// same toolchain family as our tsdown builder).
//
// Each named export of a package barrel is measured as it is actually consumed —
// `import { Name } from '@studiometa/ui'` — by tree-shaking that single symbol
// out of the built barrel, with every bare dependency (peers such as
// `@studiometa/js-toolkit`) left external and the output minified, then measured
// raw, gzipped and brotli-compressed. The whole barrel (`.`) and any side-effect
// or non-barrel entry (`autoload`, `manifest`) are measured from their own entry.
// A symbol reachable from several places (the barrel and its own subpath) has one
// size, so results are keyed by name and measured once. Requires a prior build.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const packages = [
  { name: '@studiometa/ui', dir: 'packages/ui' },
  { name: '@studiometa/ui-mapbox', dir: 'packages/ui-mapbox' },
];

const jsonArg = process.argv.indexOf('--json');
const jsonPath = jsonArg !== -1 ? process.argv[jsonArg + 1] : undefined;

function brotliSize(contents) {
  return brotliCompressSync(contents, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
}

// Bundle with esbuild and measure the combined output (dynamic-import chunks are
// summed) raw, gzipped and brotli-compressed.
async function sizeOf(options) {
  const result = await build({
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'neutral',
    // Leave every bare import (peers, third-party) external so the measurement
    // reflects the package's own shipped code, not its dependencies.
    packages: 'external',
    write: false,
    logLevel: 'silent',
    ...options,
  });
  const contents = Buffer.concat(result.outputFiles.map((file) => file.contents));
  return { raw: contents.length, gzip: gzipSync(contents).length, brotli: brotliSize(contents) };
}

// The value exports of a built barrel, via esbuild's metafile (type-only exports
// are erased in the emitted JavaScript and carry no size, so they are excluded).
async function barrelExports(entry) {
  const { metafile } = await build({
    entryPoints: [entry],
    bundle: true,
    metafile: true,
    write: false,
    format: 'esm',
    packages: 'external',
    logLevel: 'silent',
  });
  const output = Object.values(metafile.outputs).find((out) => out.entryPoint);
  return (output?.exports ?? []).filter((exported) => exported !== 'default').sort();
}

/**
 * List a package's explicit (non-pattern) subpath exports and the built entry
 * each resolves to.
 *
 * @param   {Record<string, unknown>} exports
 * @param   {string} manifestDir
 * @returns {{ subpath: string, entry: string }[]}
 */
function publicSubpaths(exports, manifestDir) {
  return Object.entries(exports)
    .filter(([key]) => key === '.' || (key.startsWith('./') && !key.includes('*') && key !== './package.json'))
    .filter(([, value]) => value && typeof value === 'object' && 'import' in value)
    .map(([subpath, value]) => ({ subpath, entry: resolve(manifestDir, value.import) }));
}

async function measure(pkg) {
  const pkgDir = resolve(root, pkg.dir);
  if (!existsSync(pkgDir)) return null;
  // On the base branch the published manifest may still be a generated
  // `dist/package.json`; prefer it when present so base and head measure the
  // same published surface regardless of layout. Entries resolve relative to it.
  const distManifest = resolve(pkgDir, 'dist/package.json');
  const manifestPath = existsSync(distManifest) ? distManifest : resolve(pkgDir, 'package.json');
  const manifestDir = dirname(manifestPath);
  const { exports } = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const barrelEntry = resolve(manifestDir, exports['.'].import);
  const resolveDir = dirname(barrelEntry);
  const names = await barrelExports(barrelEntry);

  // One row per unique export name; a name seen again (e.g. a barrel export that
  // also has its own subpath) is skipped since it is the same code, same size.
  const byName = new Map();
  async function record(exportName, options) {
    if (!byName.has(exportName)) byName.set(exportName, { subpath: exportName, ...(await sizeOf(options)) });
  }

  // The whole barrel, then every named export tree-shaken out of it.
  await record('.', { entryPoints: [barrelEntry] });
  for (const name of names) {
    await record(name, {
      stdin: { contents: `export { ${name} } from ${JSON.stringify(barrelEntry)}`, resolveDir, loader: 'js' },
    });
  }

  // Explicit subpaths that are not barrel exports — side-effect and non-barrel
  // entries such as `autoload` and `manifest` — measured from their own entry.
  for (const { subpath, entry } of publicSubpaths(exports, manifestDir)) {
    const name = subpath === '.' ? '.' : subpath.replace(/^\.\//, '');
    if (byName.has(name)) continue;
    await record(name, { entryPoints: [entry] });
  }

  const entries = [...byName.values()].sort((a, b) => b.gzip - a.gzip);
  return { name: pkg.name, entries };
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

const report = [];
for (const pkg of packages) {
  const measured = await measure(pkg);
  if (measured) report.push(measured);
}

const lines = [];
for (const { name, entries } of report) {
  lines.push(`\n### ${name}\n`);
  lines.push('| Export | Min | Min + Gzip | Min + Brotli |');
  lines.push('| --- | ---: | ---: | ---: |');
  for (const entry of entries) {
    lines.push(`| \`${entry.subpath}\` | ${kib(entry.raw)} | ${kib(entry.gzip)} | ${kib(entry.brotli)} |`);
  }
}
const markdown = lines.join('\n');

console.log(markdown);

if (jsonPath) {
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `## Export size\n${markdown}\n`, { flag: 'a' });
}
