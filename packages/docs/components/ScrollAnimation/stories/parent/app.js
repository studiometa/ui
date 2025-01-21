import { Base, createApp } from '@studiometa/js-toolkit';
import {
  ScrollAnimationParent as ScrollAnimationParentCore,
  ScrollAnimationChild,
} from '@studiometa/ui';

class ScrollAnimationParent extends ScrollAnimationParentCore {
  static config = {
    name: 'ScrollAnimationParent',
    components: {
      ScrollAnimationChild,
    },
  };
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationParent,
    },
  };
}

export default createApp(App);
