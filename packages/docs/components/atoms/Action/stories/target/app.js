import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Target } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Target,
    },
  };
}

export default createApp(App);
