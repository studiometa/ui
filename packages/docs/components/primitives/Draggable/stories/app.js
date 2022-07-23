import { Base, createApp } from '@studiometa/js-toolkit';
import { Draggable } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Draggable,
    },
  };
}

export default createApp(App, document.body);
