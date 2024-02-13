/* eslint-disable max-classes-per-file */
import { Base, createApp } from '@studiometa/js-toolkit';
import {
  Figure,
  Slider as SliderCore,
  SliderBtn,
  SliderCount,
  SliderDots,
  SliderDrag,
  SliderItem,
  SliderProgress,
} from '@studiometa/ui';

/**
 *
 */
class Slider extends SliderCore {
  static config = {
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

/**
 *
 */
class App extends Base {
  static config = {
    name: 'App',
    components: {
      Figure,
      Slider,
    },
  };
}

createApp(App, document.body);
