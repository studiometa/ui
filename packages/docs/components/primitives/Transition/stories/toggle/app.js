import { Base, createApp } from '@studiometa/js-toolkit';
import Togglable from './Togglable.js';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['enterBtn', 'leaveBtn'],
    components: {
      Togglable,
    },
  };

  onEnterBtnClick() {
    this.$children.Togglable[0].enter();
  }

  onLeaveBtnClick() {
    this.$children.Togglable[0].leave();
  }
}

export default createApp(App);
