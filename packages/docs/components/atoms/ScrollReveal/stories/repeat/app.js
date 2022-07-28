import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure, ScrollRevealRepeat } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
      ScrollRevealRepeat,
    },
  };
}

export default createApp(App);
