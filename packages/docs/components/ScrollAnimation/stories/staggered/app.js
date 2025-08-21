import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimationParent } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationParent,
    }
  };
}

createApp(App);
