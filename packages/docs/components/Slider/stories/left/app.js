import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure } from '@studiometa/ui';

import {
  Slider as SliderCore,
  SliderBtn,
  SliderCount,
  SliderDots,
  SliderDrag,
  SliderItem,
  SliderProgress,
} from '@studiometa/ui';

class Slider extends SliderCore {
  static config = {
    name: 'Slider',
    components: {
      SliderBtn,
      SliderCount,
      SliderDots,
      SliderDrag,
      SliderItem,
      SliderProgress,
    },
  };
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
      Slider,
    },
  };
}

createApp(App);
