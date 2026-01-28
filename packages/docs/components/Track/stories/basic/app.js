import { Base, createApp } from '@studiometa/js-toolkit';
import { Track, TrackContext } from '@studiometa/ui';

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
