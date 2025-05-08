import { Base, createApp } from '@studiometa/js-toolkit';
import { Draggable, Figure } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Draggable,
      Figure,
    },
  };
}

export default createApp(App, document.body);
