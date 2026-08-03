// Barrel bundled from the real local @studiometa/ui source. Stands in for the
// CDN barrel a Shopify theme would load (esm.sh's build of the published
// package is currently broken — see README). Relative paths keep it portable;
// esbuild resolves the js-toolkit peer dependency from the repo's node_modules.
export * from '../../packages/ui/Accordion/index.ts';
export * from '../../packages/ui/Disclosure/index.ts';
