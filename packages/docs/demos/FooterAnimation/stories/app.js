import { Base, createApp } from '@studiometa/js-toolkit';
import { transition } from '@studiometa/js-toolkit/utils';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['bg'],
  };

  hasReachBottom = false;

  scrolled({ x, y, changed, last, delta, progress, max, direction }) {
    if (y === max.y) {
      this.hasReachBottom = true;
      return transition(this.$refs.bg, {
        to: {
          transform: 'scale(0.8)',
          border: '2px solid #a8a29e',
          borderRadius: '3.5rem',
        }
      }, 'keep');
    }

    if (this.hasReachBottom && y < max.y) {
      this.hasReachBottom = false;
      return transition(this.$refs.bg, {
        to: {
          transform: 'scale(1)',
          border: '0px solid #a8a29e',
          borderRadius: '0',
        }
      }, 'keep');
    }
  }
}

export default createApp(App, document.body);
