import { Base, createApp } from '@studiometa/js-toolkit';
import {
  ScrollAnimationTimeline,
  ScrollAnimationTarget,
  withScrollAnimationDebug,
} from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationTimeline: withScrollAnimationDebug(ScrollAnimationTimeline),
      ScrollAnimationTarget,
    },
  };
}

export default createApp(App);
