import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, basename, join, relative } from 'node:path';
import { gzipSizeSync } from 'gzip-size';
import { build } from './shared.js';

const toKiloBytes = (bytes) => (bytes / 1024).toFixed(2);

const log = (a, b, c) => {
  console.log(a.padEnd(30, ' '), b.padEnd(10, ' '), c);
};

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
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path, root)));
    else files.push(relative(root, path));
  }
  return files;
}

// Measure the minified export sizes off a throwaway build: the report only needs
// the minified byte size of each emitted module, so declarations and source maps
// are skipped and the output is written to a temporary directory that is removed
// once measured.
const outDir = await mkdtemp(join(tmpdir(), 'studiometa-ui-sizes-'));

try {
  await build({
    outDir,
    minify: true,
    sourcemap: false,
    dts: false,
    clean: true,
  });

  console.log('');
  log('Export', 'Size', 'Gzipped sized');

  const files = (await listFiles(outDir)).filter((file) => file.endsWith('.js'));
  const sizes = [];
  for (const file of files) {
    if (file.endsWith('index.js') || file.endsWith('utils.js')) continue;
    const text = await readFile(join(outDir, file), 'utf8');
    const name = basename(file, extname(file));
    const size = `${toKiloBytes(text.length)} kB`;
    const gzip = `${toKiloBytes(gzipSizeSync(text))} kB`;
    log(name, size, gzip);
    sizes.push({ name, path: file, size, gzip });
  }

  console.log('');
} finally {
  await rm(outDir, { recursive: true, force: true });
}
