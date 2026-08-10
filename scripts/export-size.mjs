// Measure the published export sizes of the workspace packages, replacing the
// third-party export-size GitHub Action with a local check built on esbuild (the
// same toolchain family as our tsdown builder). Each public subpath is bundled
// from its built `dist` entry with all bare dependencies (peers such as
// `@studiometa/js-toolkit`) left external, minified, then measured raw, gzipped
// and brotli-compressed. Requires the packages to be built first.
import { readFileSync, writeFileSync } from 'node:fs';
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

/**
 * List a package's public subpaths and the built `dist` entry each resolves to.
 *
 * @param   {Record<string, unknown>} exports
 * @param   {string} pkgDir
 * @returns {{ subpath: string, entry: string }[]}
 */
function publicEntries(exports, pkgDir) {
  return Object.entries(exports)
    .filter(([key]) => key === '.' || (key.startsWith('./') && !key.includes('*') && key !== './package.json'))
    .filter(([, value]) => value && typeof value === 'object' && 'import' in value)
    .map(([subpath, value]) => ({ subpath, entry: resolve(pkgDir, value.import) }));
}

async function measure(pkg) {
  const pkgDir = resolve(root, pkg.dir);
  const { exports } = JSON.parse(readFileSync(resolve(pkgDir, 'package.json'), 'utf8'));
  const entries = [];
  for (const { subpath, entry } of publicEntries(exports, pkgDir)) {
    const result = await build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: 'esm',
      platform: 'neutral',
      // Leave every bare import (peers, third-party) external so the measurement
      // reflects the package's own shipped code, not its dependencies.
      packages: 'external',
      write: false,
      logLevel: 'silent',
    });
    const { contents } = result.outputFiles[0];
    entries.push({
      subpath,
      raw: contents.length,
      gzip: gzipSync(contents).length,
      brotli: brotliSize(contents),
    });
  }
  entries.sort((a, b) => b.gzip - a.gzip);
  return { name: pkg.name, entries };
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

const report = [];
for (const pkg of packages) {
  report.push(await measure(pkg));
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
