import { registerComponent } from '@studiometa/js-toolkit';
import { Track as TrackCore, TrackContext } from '@studiometa/ui';

/**
 * Mirror the current `window.dataLayer` into the story's debug panel.
 */
function renderDebug() {
  const el = document.querySelector('[data-debug-datalayer]');
  if (el) {
    el.textContent = JSON.stringify(window.dataLayer ?? [], null, 2);
  }
}

/**
 * Demo provider.
 *
 * The default `Track` pushes to `window.dataLayer`; here we override the
 * `dispatch` seam only to also refresh the on-page debug panel so the stories
 * show what was sent.
 */
class Track extends TrackCore {
  dispatch(payload, event) {
    super.dispatch(payload, event);
    renderDebug();
  }
}

registerComponent(Track);
registerComponent(TrackContext);
