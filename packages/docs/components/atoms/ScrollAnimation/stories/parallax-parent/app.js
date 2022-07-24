import { Base, createApp } from '@studiometa/js-toolkit';
import ParallaxParent from './ParallaxParent.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ParallaxParent,
    },
  };
}

export default createApp(App);
