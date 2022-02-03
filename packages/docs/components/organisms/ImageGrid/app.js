import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
    },
  };
}

export default createApp(App, document.body);
