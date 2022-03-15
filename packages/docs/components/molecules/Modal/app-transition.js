import { Base, createApp } from '@studiometa/js-toolkit';
import { ModalWithTransition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Modal: ModalWithTransition,
    },
  };
}

export default createApp(App, document.body);
