import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure, ScrollAnimationChild, ScrollAnimationParent } from '@studiometa/ui';

class ParallaxChild extends ScrollAnimationChild {
  static config = {
    ...ScrollAnimationChild.config,
    name: 'ParallaxChild',
    components: {
      Figure,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }
}

class ParallaxParent extends ScrollAnimationParent {
  static config = {
    ...ScrollAnimationParent.config,
    name: 'ParallaxParent',
    components: {
      ParallaxChild,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }

  scrolledInView(props) {
    this.$children.ParallaxChild.forEach((child) => {
      child.scrolledInView(props);
    });
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ParallaxParent,
    },
  };
}

export default createApp(App);
