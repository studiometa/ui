import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Dialog, Transition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Dialog,
      Transition,
    },
  };
}

export default createApp(App);
