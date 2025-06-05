import { Base, createApp } from '@studiometa/js-toolkit';
import { LazyInclude } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      LazyInclude,
    },
  };
}

createApp(App);
