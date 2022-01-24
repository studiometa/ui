import { Base, createApp } from '@studiometa/js-toolkit';
import { Sticky } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Sticky,
    },
  };
}

export default createApp(App, document.body);
