import { Base, createApp } from '@studiometa/js-toolkit';
import ScrollAnimationParent from './ScrollAnimationParent.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationParent,
    },
  };
}

export default createApp(App);
