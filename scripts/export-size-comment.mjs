// Render a pull-request comment diffing two `export-size.mjs --json` reports
// (base vs head) and print it to stdout. Only exports whose size changed — plus
// added and removed exports — are listed. The workflow upserts the output as a
// sticky comment, matched by the marker below.
import { readFileSync } from 'node:fs';

const MARKER = '<!-- export-size-report -->';

const [basePath, headPath] = process.argv.slice(2);
if (!basePath || !headPath) {
  console.error('Usage: node scripts/export-size-comment.mjs <base.json> <head.json>');
  process.exit(1);
}

/**
 * Index a report as `{ [package]: { [subpath]: { raw, gzip, brotli } } }`.
 *
 * @param   {string} path
 * @returns {Record<string, Record<string, { raw: number, gzip: number, brotli: number }>>}
 */
function index(path) {
  const report = JSON.parse(readFileSync(path, 'utf8'));
  const map = {};
  for (const { name, entries } of report) {
    map[name] = {};
    for (const entry of entries) map[name][entry.subpath] = entry;
  }
  return map;
}

const base = index(basePath);
const head = index(headPath);

function kib(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

const HEADER = ['| Export | Size (gzip) | Diff |', '| :-- | --: | :-: |'];

function name(subpath) {
  return subpath === '.' ? '(index)' : subpath.replace(/^\.\//, '');
}

// A signed gzip delta with percentage, or a new/removed marker.
function diff(b, h) {
  if (!b) return '🆕 new';
  if (!h) return '🗑 removed';
  const d = h.gzip - b.gzip;
  const sign = d > 0 ? '+' : '';
  const percent = b.gzip === 0 ? '' : ` (${sign}${((d / b.gzip) * 100).toFixed(1)}%)`;
  return `${sign}${kib(d)}${percent}`;
}

const packages = [...new Set([...Object.keys(base), ...Object.keys(head)])].sort();
const changedSections = [];
const unchangedSections = [];
let changedCount = 0;
let unchangedCount = 0;

for (const pkg of packages) {
  const baseEntries = base[pkg] ?? {};
  const headEntries = head[pkg] ?? {};
  const subpaths = [...new Set([...Object.keys(baseEntries), ...Object.keys(headEntries)])].sort();

  const changed = [];
  const unchanged = [];
  for (const subpath of subpaths) {
    const b = baseEntries[subpath];
    const h = headEntries[subpath];
    if (b && h && b.gzip === h.gzip) {
      unchanged.push(`| \`${name(subpath)}\` | ${kib(h.gzip)} | – |`);
    } else {
      // Show the current size, or the removed one when the export is gone.
      changed.push(`| \`${name(subpath)}\` | ${kib((h ?? b).gzip)} | ${diff(b, h)} |`);
    }
  }

  if (changed.length > 0) {
    changedCount += changed.length;
    changedSections.push([`#### <kbd>${pkg}</kbd>`, '', ...HEADER, ...changed].join('\n'));
  }
  if (unchanged.length > 0) {
    unchangedCount += unchanged.length;
    unchangedSections.push([`#### <kbd>${pkg}</kbd>`, '', ...HEADER, ...unchanged].join('\n'));
  }
}

const body = [MARKER, '## Export size', ''];
body.push('Bundled per export with peer dependencies left external and minified; sizes are gzipped.', '');

if (changedCount === 0) {
  body.push('✅ No export size changes.', '');
} else {
  body.push(...changedSections.flatMap((section) => [section, '']));
}

if (unchangedCount > 0) {
  body.push(
    `<details><summary>Unchanged (${unchangedCount})</summary>`,
    '',
    ...unchangedSections.flatMap((section) => [section, '']),
    '</details>',
  );
}

console.log(body.join('\n'));
