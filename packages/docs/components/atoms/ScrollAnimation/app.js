import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimation } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimation,
    },
  };
}

export default createApp(App);
