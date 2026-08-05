// The @studiometa/ui component manifest served as the externalizable `/ui@<version>/manifest.js` CDN
// entry point. It re-exports the package's own `manifest` (ui components only) so the ui-autoload
// runtime's `ui.js` side-effect entry — which does `import { manifest } from '@studiometa/ui/manifest'`
// externalized to this URL — resolves the `manifest` binding. Because this entry is bundled alongside
// every ui component entry, rolldown rewrites the manifest's lazy `import('./<Component>/<Component>.js')`
// loaders to the flat `../<Component>.js` chunks the CDN serves. The two packages' manifests are
// composed at runtime by the autoload engine, not pre-composed here.
export { manifest } from '@studiometa/ui/manifest';
