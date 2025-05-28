import { Base, createApp } from '@studiometa/js-toolkit';
import { Menu, Action } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Menu,
      Action,
    },
  };
}

createApp(App, document.body);
