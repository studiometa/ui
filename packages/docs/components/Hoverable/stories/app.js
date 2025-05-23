import { Base, createApp } from '@studiometa/js-toolkit';
import { Hoverable, Figure } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Hoverable,
      Figure,
    },
  };
}

export default createApp(App);
