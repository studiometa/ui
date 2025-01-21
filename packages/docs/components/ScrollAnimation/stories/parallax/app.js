import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure, ScrollAnimation } from '@studiometa/ui';

class Parallax extends ScrollAnimation {
  static config = {
    ...ScrollAnimation.config,
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
