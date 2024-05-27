import { Base, createApp } from 'https://cdn.skypack.dev/@studiometa/js-toolkit';
import { clamp, damp, transform } from 'https://cdn.skypack.dev/@studiometa/js-toolkit/utils';
class Navbar extends Base {
  static config = {
    name: 'Navbar',
  }

  y = 0;
  dampedY = 0;
  dampFactor = 0.7;
  dampFactorAuto = 0.7;
  dampFactorMethod = 0.1;
  lastDirection = null;

  get targetY() {
    return this.$el.offsetHeight * -1;
  }

  scrolled({ direction, delta, progress }) {
    if (direction.y === 'NONE') {
      if (this.lastDirection === 'UP') {
        this.show();
        return;
      }
      this.hide();
      return;
    }

    this.lastDirection = direction.y;

    if (progress.y < 0) {
      this.y = 0;
      return;
    }

    if (progress.y >= 1) {
      this.y = this.targetY();
      return;
    }

    this.dampFactor = this.dampFactorAuto;
    this.y = clamp(this.y - delta.y, 0, this.targetY);
    this.$services.enable('raf');
  }

  ticked() {
    this.dampedY = damp(this.y, this.dampedY, this.dampFactor);
    transform(this.$el, {
      y: this.dampedY,
    });
    if (this.dampedY === this.y) {
      this.$services.disable('raf');
    }
  }

  show() {
    this.dampFactor = this.dampFactorMethod;
    this.y = 0;
    this.$services.enable('raf');
  }

  hide() {
    this.dampFactor = this.dampFactorMethod;
    this.y = this.targetY;
    this.$services.enable('raf');
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Navbar
    }
  };
}

createApp(App);
