import { Base, registerComponent } from '@studiometa/js-toolkit';
import { ViewTransition } from '@studiometa/ui';

class Togglable extends ViewTransition {
  static config = {
    name: 'Togglable',
  };
}

class App extends Base {
  static config = {
    name: 'App',
    refs: ['enterBtn', 'leaveBtn'],
    components: {
      Togglable,
    },
  };

  onEnterBtnClick() {
    this.$query('Togglable')[0].enter();
  }

  onLeaveBtnClick() {
    this.$query('Togglable')[0].leave();
  }
}

registerComponent(App);
