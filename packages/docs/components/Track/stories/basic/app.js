import { Base, createApp } from '@studiometa/js-toolkit';
import { Track, TrackContext, setTrackDispatcher } from '@studiometa/ui';

// Custom dispatcher that also updates debug elements
setTrackDispatcher((data) => {
  // Push to dataLayer (default behavior)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);

  // Update debug elements
  const debugEl = document.querySelector('[data-debug-datalayer]');
  if (debugEl) {
    debugEl.textContent = JSON.stringify(window.dataLayer, null, 2);
  }
});

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Track,
      TrackContext,
    },
  };
}

export default createApp(App);
