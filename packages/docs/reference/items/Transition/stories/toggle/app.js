import { Base, registerComponent } from '@studiometa/js-toolkit';
import { Transition } from '@studiometa/ui';

class Togglable extends Transition {
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
