let originalLoad;

/**
 * Mock `HTMLMediaElement.prototype.load` so it synchronously dispatches the
 * `loadeddata` and `canplaythrough` events — happy-dom's `load()` is a no-op
 * and never fires them, which would otherwise leave `FigureVideo` waiting
 * forever.
 */
export function mockVideoLoad() {
  originalLoad = HTMLMediaElement.prototype.load;
  HTMLMediaElement.prototype.load = function load() {
    this.dispatchEvent(new Event('loadeddata'));
    this.dispatchEvent(new Event('canplaythrough'));
  };
}

export function unmockVideoLoad() {
  if (originalLoad) {
    HTMLMediaElement.prototype.load = originalLoad;
  }

  originalLoad = null;
}
