import { Base, createApp } from '@studiometa/js-toolkit';
import Figure from './Figure.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
    },
  };
}

export default createApp(App, document.body);
