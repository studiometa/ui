import { extname, basename } from 'path';
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

  result.outputFiles
    .filter((file) => !(file.path.endsWith('index.js') || file.path.endsWith('utils.js')))
    .forEach((file) => {
      const name = basename(file.path, extname(file.path));
      const size = `${toKiloBytes(file.text.length)}kb`;
      const gzip = `${toKiloBytes(gzipSizeSync(file.text))}kb`;

      log(name, size, gzip);
    });
  console.log('');
});
