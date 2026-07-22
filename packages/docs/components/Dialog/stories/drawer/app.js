import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Dialog, ViewTransition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Dialog,
      ViewTransition,
    },
  };
}

export default createApp(App);
