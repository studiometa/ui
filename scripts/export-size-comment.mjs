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

// Normalize an entry key so an older subpath-based report (`./Modal`) lines up
// with a named-export report (`Modal`) in the diff.
function key(entry) {
  return entry === '.' ? '.' : entry.replace(/^\.\//, '');
}

/**
 * Index a report as `{ [package]: { [name]: { raw, gzip, brotli } } }`.
 *
 * @param   {string} path
 * @returns {Record<string, Record<string, { raw: number, gzip: number, brotli: number }>>}
 */
function index(path) {
  const report = JSON.parse(readFileSync(path, 'utf8'));
  const map = {};
  for (const { name, entries } of report) {
    map[name] = {};
    for (const entry of entries) map[name][key(entry.subpath)] = entry;
  }
  return map;
}

const base = index(basePath);
const head = index(headPath);

function kib(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}

const HEADER = ['| Export | Size (gzip) | Diff |', '| :-- | --: | :-: |'];

function name(entry) {
  return entry === '.' ? '(barrel)' : entry;
}

// A signed gzip delta with percentage. Added exports read as +100%, removed
// exports as -100% (their whole size appears or disappears).
function diff(b, h) {
  const before = b ? b.gzip : 0;
  const after = h ? h.gzip : 0;
  const bytes = after - before;
  const percent = before === 0 ? 100 : (bytes / before) * 100;
  const bytesSign = bytes > 0 ? '+' : '';
  const percentSign = percent > 0 ? '+' : '';
  return `${bytesSign}${kib(bytes)} (${percentSign}${percent.toFixed(1)}%)`;
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
