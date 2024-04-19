import { Base, createApp } from 'https://cdn.skypack.dev/@studiometa/js-toolkit';
import { tween, lerp, easeOutQuad } from 'https://cdn.skypack.dev/@studiometa/js-toolkit/utils';

class Navbar extends Base {
  static config = {
    name: 'Navbar',
  };

  translateY = 0;

  lastDirection = 'UP';

  animation = null;

  stopAnimation() {
    if(this.animation) {
      this.animation.pause();
      this.animation = null;
    }
  }

  hide(options) {
    this.stopAnimation();

    const { height } = this.$el.getBoundingClientRect();

    if (this.translateY === -height) {
      return;
    }

    const from = this.translateY;
    const to = -height;

    this.animation = tween(
      (progress) => {
        const value = lerp(from, to, progress);
        this.$el.style.transform = `translateY(${this.translateY}px)`;
        this.translateY = value;
      },
      {
        duration: 0.3,
        easing: easeOutQuad,
        ...options,
      },
    );

    this.animation.start();
  }

  show(options) {
    this.stopAnimation();

    if (this.translateY === 0) {
      return;
    }

    const from = this.translateY;
    const to = 0;

    this.animation = tween(
      (progress) => {
        const value = lerp(from, to, progress);
        this.$el.style.transform = `translateY(${this.translateY}px)`;
        this.translateY = value;
      },
      {
        duration: 0.3,
        easing: easeOutQuad,
        ...options,
      },
    );

    this.animation.start();
  }

  toggle(options = {}, condition) {
    if ((condition ?? (this.translateY > -(this.$el.getBoundingClientRect().height / 3)))) {
      return this.show(options);
    } else {
      return this.hide(options);
    }
}

  onFocusin() {
    this.show();
  }

  onMouseenter() {
    this.show();
  }

  scrolled({ direction, y, delta, changed, progress }) {
    const { height } = this.$el.getBoundingClientRect();

    this.stopAnimation();

    if (direction.y === 'NONE') {
      if ((this.translateY !== height || this.translateY !== 0) && (y > height || this.lastDirection === 'UP') && progress.y < 1) {
        this.toggle({ delay: 1 }, this.lastDirection === 'UP');
      }
      return;
    }

    if (!changed.y) {
      return;
    }

    this.lastDirection = direction.y;

    if (progress.y < 0) {
      this.translateY = 0;
      return;
    }

    if (progress.y >= 1) {
      this.translateY = -height;
      return;
    }

    const value = Math.min(Math.max(this.translateY - delta.y, -height), 0);

    if (value === this.translateY) {
      return;
    }

    this.translateY = value;
    this.$el.style.transform = `translateY(${this.translateY}px)`;
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
