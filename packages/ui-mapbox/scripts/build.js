import glob from 'fast-glob';
import esbuild from 'esbuild';

function resolve(path, origin = import.meta.url) {
  return new URL(path, origin).pathname;
}

const root = resolve('../');

const entryPoints = glob.sync(['**/*.ts', '!scripts/**', '!dist/**', '!**/node_modules/**'], {
  cwd: root,
});

const outdir = resolve('../dist');

async function build() {
  console.log('Building esm...');
  const result = await esbuild.build({
    entryPoints: entryPoints.map((entry) => resolve(`../${entry}`)),
    write: true,
    outdir,
    outbase: root,
    format: 'esm',
    target: 'esnext',
    sourcemap: true,
  });

  result.errors.forEach((error) => console.error(error));
  result.warnings.forEach((warning) => console.warn(warning));
  console.log('Done building esm!');
}

build();
