import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Modal, Panel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Modal,
      Panel,
      Action,
    },
  };
}

export default createApp(App, document.body);
