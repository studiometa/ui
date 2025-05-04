import { Base, createApp } from '@studiometa/js-toolkit';
import { Frame, DataComputed, DataModel, Action } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['form'],
    components: {
      Frame,
      DataModel,
      DataComputed,
      Action,
    }
  };

  mounted() {
    this.$refs.form.requestSubmit();
  }
}

export default createApp(App);
