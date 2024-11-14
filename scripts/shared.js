import glob from 'fast-glob';
import esbuild from 'esbuild';

export const resolve = (path, origin = import.meta.url) => new URL(path, origin).pathname;

const entryPoints = glob.sync(['packages/ui/**/*.js', 'packages/ui/**/*.ts', '!**/node_modules/**'], {
  cwd: resolve('..'),
});

const outdir = resolve('../dist', import.meta.url);

const defaultOptions = {
  entryPoints,
  write: true,
  outdir,
  target: 'esnext',
  sourcemap: true
};

/**
 * Build with esbuild.
 *
 * @param   {require('esbuild').BuildOptions} opts
 * @returns {Promise<void>}
 */
export async function build(opts) {
  console.log(`Building ${opts.format}...`);
  const result = await esbuild.build({
    ...defaultOptions,
    ...opts,
  });

  result.outdir = outdir;

  result.errors.forEach(console.error);
  result.warnings.forEach(console.warn);
  console.log(`Done building ${opts.format}!`);

  return result;
}
