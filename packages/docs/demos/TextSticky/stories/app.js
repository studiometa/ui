import { Base, createApp } from '@studiometa/js-toolkit';
import {
  ScrollAnimationChild,
  ScrollAnimationParent as ScrollAnimationParentCore,
} from '@studiometa/ui';

class ScrollAnimationParent extends ScrollAnimationParentCore {
  static config = {
    name: 'ScrollAnimationParent',
    components: {
      ScrollAnimationChild,
    },
  };

  scrolledInView(props) {
    this.$children.ScrollAnimationChild.forEach((child) => {
      child.scrolledInView(props);
    });
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationParent,
    }
  };
}

createApp(App)
