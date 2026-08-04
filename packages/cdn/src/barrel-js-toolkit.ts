// Entry point for the versioned js-toolkit CDN artifact served at `/js-toolkit@<version>/index.js`.
// It is bundled as its own tree so every @studiometa/ui output can import js-toolkit by this single
// absolute, origin-relative URL and share one runtime instance across the browser.
export * from '@studiometa/js-toolkit';
