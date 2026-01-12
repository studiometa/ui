import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure, ScrollAnimationTarget, ScrollAnimationTimeline } from '@studiometa/ui';

class ParallaxTarget extends ScrollAnimationTarget {
  static config = {
    ...ScrollAnimationTarget.config,
    name: 'ParallaxTarget',
    components: {
      Figure,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }
}

class ParallaxTimeline extends ScrollAnimationTimeline {
  static config = {
    ...ScrollAnimationTimeline.config,
    name: 'ParallaxTimeline',
    components: {
      ParallaxTarget,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }

  scrolledInView(props) {
    this.$children.ParallaxTarget.forEach((child) => {
      child.scrolledInView(props);
    });
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ParallaxTimeline,
    },
  };
}

export default createApp(App);
