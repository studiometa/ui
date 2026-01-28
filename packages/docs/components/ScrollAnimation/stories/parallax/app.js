import { Base, createApp, withScrolledInView } from '@studiometa/js-toolkit';
import { Figure, ScrollAnimationTarget } from '@studiometa/ui';

class Parallax extends withScrolledInView(ScrollAnimationTarget) {
  static config = {
    ...ScrollAnimationTarget.config,
    name: 'Parallax',
    components: {
      Figure,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Parallax,
    },
  };
}

export default createApp(App);
