import { registerComponent } from '@studiometa/js-toolkit';
import { FigureTwicpics } from '@studiometa/ui';

class Figure extends FigureTwicpics {
  get domain() {
    return 'studiometa.twic.pics';
  }

  get path() {
    return 'ui';
  }
}

registerComponent(Figure, 'Figure');
