// Full @studiometa/ui-mapbox public barrel served as the manually-importable
// `/ui-mapbox@<version>/index.js` CDN entry point. It re-exports every public export of
// @studiometa/ui-mapbox so consumers can pull the whole surface from one module while sharing the
// single externalized js-toolkit instance and resolving mapbox-gl from their own import map.
export * from '@studiometa/ui-mapbox';
