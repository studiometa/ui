import { Base, createApp } from '@studiometa/js-toolkit';
import Slider from './Slider.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Slider,
    },
  };
}

export default createApp(App, document.body);
