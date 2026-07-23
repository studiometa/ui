/* eslint-disable require-jsdoc */
/* eslint-disable import/no-extraneous-dependencies */
import { registerComponent } from '@studiometa/js-toolkit';
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
