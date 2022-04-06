import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimation, ScrollAnimationWithEase } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimation,
      ScrollAnimationWithEase,
    },
  };
}

export default createApp(App);
