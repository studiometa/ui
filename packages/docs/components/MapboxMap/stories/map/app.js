import { Base, createApp } from '@studiometa/js-toolkit';
import { MapboxMap } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      MapboxMap,
    },
  };
}

createApp(App);
