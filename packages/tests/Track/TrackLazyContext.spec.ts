import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerComponents, registerManifest } from '@studiometa/js-toolkit';
import { mount, resetDom, settle, waitFor } from '@studiometa/js-toolkit/test';
import { Track } from '#private/Track/Track.js';
import { TrackContext } from '#private/Track/TrackContext.js';

/**
 * `TrackContext` is reachable through a manifest only, as with the `/autoload`
 * entries: its module resolves after `Track` has mounted. The registry is
 * page-wide, so this needs a file of its own, where nothing registers
 * `TrackContext` eagerly.
 */
let loads = 0;

registerComponents(Track);
registerManifest({
  TrackContext: () =>
    new Promise((resolve) => {
      loads += 1;
      setTimeout(() => resolve(TrackContext), 300);
    }),
});

afterEach(resetDom);

beforeEach(() => {
  window.dataLayer = [];
});

describe('Track — the `mounted` pseudo-event under lazy loading', () => {
  it('dispatches with the context of a TrackContext ancestor imported lazily', async () => {
    await mount(`
      <div data-component="TrackContext" data-option-context='{"page_type": "home"}'>
        <div data-component="Track" data-track:mounted='{"event": "page_view"}'></div>
      </div>
    `);

    await waitFor(() => (window.dataLayer ?? []).length > 0, {
      message: 'Expected the mounted event to be pushed.',
      timeout: 3000,
    });
    await settle();

    // The manifest path was the one taken, not an eager registration.
    expect(loads).toBe(1);
    expect(window.dataLayer).toEqual([{ page_type: 'home', event: 'page_view' }]);
  });
});
