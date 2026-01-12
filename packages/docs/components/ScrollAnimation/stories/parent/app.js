import { Base, createApp } from '@studiometa/js-toolkit';
import {
  ScrollAnimationTimeline,
  ScrollAnimationTarget,
} from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationTimeline,
      ScrollAnimationTarget,
    },
  };
}

export default createApp(App);
