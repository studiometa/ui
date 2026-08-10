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

function delta(before, after) {
  const diff = after - before;
  const sign = diff > 0 ? '+' : '';
  const percent = before === 0 ? '' : `, ${sign}${((diff / before) * 100).toFixed(1)}%`;
  return `${sign}${kib(diff)}${percent}`;
}

/**
 * Format one metric as `before → after (Δ)`, or new/removed when one side is
 * absent. Returns an empty string when the metric is unchanged.
 */
function cell(beforeEntry, afterEntry, key) {
  if (!beforeEntry) return `— → **${kib(afterEntry[key])}**`;
  if (!afterEntry) return `~~${kib(beforeEntry[key])}~~ → —`;
  if (beforeEntry[key] === afterEntry[key]) return kib(afterEntry[key]);
  return `${kib(beforeEntry[key])} → **${kib(afterEntry[key])}** (${delta(beforeEntry[key], afterEntry[key])})`;
}

const packages = [...new Set([...Object.keys(base), ...Object.keys(head)])].sort();
const sections = [];

for (const name of packages) {
  const baseEntries = base[name] ?? {};
  const headEntries = head[name] ?? {};
  const subpaths = [...new Set([...Object.keys(baseEntries), ...Object.keys(headEntries)])].sort();

  const rows = [];
  for (const subpath of subpaths) {
    const b = baseEntries[subpath];
    const h = headEntries[subpath];
    const unchanged = b && h && b.raw === h.raw && b.gzip === h.gzip && b.brotli === h.brotli;
    if (unchanged) continue;
    rows.push(
      `| \`${subpath}\` | ${cell(b, h, 'raw')} | ${cell(b, h, 'gzip')} | ${cell(b, h, 'brotli')} |`,
    );
  }

  if (rows.length === 0) continue;
  sections.push(
    [
      `### ${name}`,
      '',
      '| Export | Min | Min + Gzip | Min + Brotli |',
      '| --- | ---: | ---: | ---: |',
      ...rows,
    ].join('\n'),
  );
}

const body =
  sections.length === 0
    ? `${MARKER}\n## Export size\n\n✅ No export size changes.`
    : [
        MARKER,
        '## Export size',
        '',
        'Sizes are bundled per export with peer dependencies left external, minified.',
        '',
        ...sections,
      ].join('\n');

console.log(body);
