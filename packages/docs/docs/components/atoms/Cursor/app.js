import { Base, createApp } from '@studiometa/js-toolkit';
import { Cursor } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Cursor,
    },
  };
}

export default createApp(App, document.body);
