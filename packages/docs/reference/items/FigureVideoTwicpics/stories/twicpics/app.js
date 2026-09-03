import { registerComponent } from '@studiometa/js-toolkit';
import { FigureVideoTwicpics } from '@studiometa/ui';

class FigureVideo extends FigureVideoTwicpics {
  static config = {
    name: 'FigureVideo',
  };

  get domain() {
    return 'studiometa.twic.pics';
  }

  get path() {
    return 'ui-videos';
  }
}

registerComponent(FigureVideo);
