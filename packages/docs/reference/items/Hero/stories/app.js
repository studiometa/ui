import { registerComponent } from '@studiometa/js-toolkit';
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

registerComponent(Figure);
registerComponent(Slider, 'Slider');
