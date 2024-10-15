import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Transition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Transition,
    },
  };
}

export default createApp(App);
