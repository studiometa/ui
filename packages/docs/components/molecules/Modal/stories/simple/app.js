import { Base, createApp } from '@studiometa/js-toolkit';
import { Modal } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Modal,
    },
  };
}

export default createApp(App, document.body);
