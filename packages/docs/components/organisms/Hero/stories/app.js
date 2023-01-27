import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure } from '@studiometa/ui';
import Slider from './slider/Slider.js';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
      Slider,
    },
  };
}

export default createApp(App, document.body);
