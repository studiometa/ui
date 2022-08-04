import { extname, basename, relative } from 'node:path';
import { writeFileSync } from 'node:fs';
import { gzipSizeSync } from 'gzip-size';
import { build } from './shared.mjs';

const toKiloBytes = (bytes) => (bytes / 1024).toFixed(2);

const log = (a, b, c) => {
  console.log(a.padEnd(30, ' '), b.padEnd(10, ' '), c);
};

build({
  format: 'esm',
  write: false,
  minify: true,
}).then(async (result) => {
  console.log('');
  log('Export', 'Size', 'Gzipped sized');

  const sizes = result.outputFiles
    .filter((file) => !(file.path.endsWith('index.js') || file.path.endsWith('utils.js')))
    .map((file) => {
      const name = basename(file.path, extname(file.path));
      const size = `${toKiloBytes(file.text.length)} kB`;
      const gzip = `${toKiloBytes(gzipSizeSync(file.text))} kB`;

      log(name, size, gzip);
      return { name, path: relative(result.outdir, file.path), size, gzip };
    });

  writeFileSync(
    './sizes.mjs',
    sizes.map((size) => `export const ${size.name} = ${JSON.stringify(size)};`).join('\n')
  );
  console.log('');
});
