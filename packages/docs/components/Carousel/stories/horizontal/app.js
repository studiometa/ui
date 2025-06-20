import { Base, createApp } from '@studiometa/js-toolkit';
import { Carousel } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Carousel,
    },
  };
}

createApp(App);
