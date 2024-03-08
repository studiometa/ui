import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure, ScrollAnimationParent, ScrollAnimation } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
      ScrollAnimation,
      ScrollAnimationParent,
    },
  };
}

createApp(App, {
  features: {
    asyncChildren: true,
  },
});
