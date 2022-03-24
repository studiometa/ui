import { Base, createApp } from '@studiometa/js-toolkit';
import Menu from './Menu.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Menu,
    },
  };
}

export default createApp(App, document.body);
