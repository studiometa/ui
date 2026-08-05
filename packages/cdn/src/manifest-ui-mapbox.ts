// The @studiometa/ui-mapbox component manifest served as the externalizable
// `/ui-mapbox@<version>/manifest.js` CDN entry point. It re-exports the package's own `manifest`
// (Mapbox components only) so the ui-autoload runtime's `ui-mapbox.js` side-effect entry — which does
// `import { manifest } from '@studiometa/ui-mapbox/manifest'` externalized to this URL — resolves the
// `manifest` binding. Because this entry is bundled alongside every ui-mapbox component entry, rolldown
// rewrites the manifest's lazy `import('./<Component>.js')` loaders to the flat `../<Component>.js`
// chunks the CDN serves. The two packages' manifests are composed at runtime by the autoload engine.
export { manifest } from '@studiometa/ui-mapbox/manifest';
