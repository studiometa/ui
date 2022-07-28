import { Base, createApp } from '@studiometa/js-toolkit';
import { TableOfContent } from '@studiometa/ui';

/**
 * App class.
 */
class App extends Base {
  static config = {
    name: 'App',
    components: {
      TableOfContent,
    }
  };
}

export default createApp(App);
