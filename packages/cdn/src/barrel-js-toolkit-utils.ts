// Entry point for the versioned js-toolkit utils CDN artifact served at
// `/js-toolkit@<version>/utils/index.js`. It shares the js-toolkit tree's internal chunks with the
// main entry so both resolve to the same runtime within a single versioned artifact.
export * from '@studiometa/js-toolkit/utils';
