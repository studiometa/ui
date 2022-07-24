import { Figure, ScrollAnimation } from '@studiometa/ui';

export default class Parallax extends ScrollAnimation {
  static config = {
    ...ScrollAnimation.config,
    name: 'Parallax',
    components: {
      Figure,
    },
  };

  get target() {
    return this.$children.Figure[0].$el;
  }
}
