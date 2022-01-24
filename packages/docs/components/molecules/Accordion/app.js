import { Base, createApp } from '@studiometa/js-toolkit';
import { Accordion } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Accordion,
    },
  };
}

export default createApp(App, document.body);
