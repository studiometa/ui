import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure, ScrollReveal } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
      ScrollReveal,
    },
  };
}

export default createApp(App);
