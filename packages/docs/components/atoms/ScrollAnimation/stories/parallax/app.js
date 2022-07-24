import { Base, createApp } from '@studiometa/js-toolkit';
import Parallax from './Parallax.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Parallax,
    },
  };
}

export default createApp(App);
