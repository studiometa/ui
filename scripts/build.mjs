import { build } from './shared.mjs';

build({
  format: 'esm',
  minify: true,
});

build({
  format: 'cjs',
  bundle: true,
  outExtension: { '.js': '.cjs' },
  footer: {
    // Fix `export default {}` assigned to `module.exports.default`
    js: 'if (module.exports.default) module.exports = module.exports.default;'
  },
  plugins: [
    // @see https://github.com/evanw/esbuild/issues/622#issuecomment-769462611
    {
      name: 'change-extension-to-cjs',
      setup(builder) {
        // eslint-disable-next-line consistent-return
        builder.onResolve({ filter: /.*/ }, (args) => {
          if (args.importer) {
            return {
              path: args.path.replace(/\.js$/, '.cjs'),
              external: true,
            };
          }
        });
      },
    },
  ],
});
