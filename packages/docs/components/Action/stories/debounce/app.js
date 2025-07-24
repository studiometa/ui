import { Base, createApp } from '@studiometa/js-toolkit';
import { Action } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
    },
  };
}

export default createApp(App);
