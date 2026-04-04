import { Base, createApp } from '@studiometa/js-toolkit';
import { Indexable } from '@studiometa/ui';

class Counter extends Indexable {
  static config = {
    name: 'Counter',
  };

  get length() {
      return 10;
  }

  onIndex() {
    this.$el.textContent = this.currentIndex;
  }
}

class App extends Base {
  static config = {
    name: 'App',
    refs: ['prevBtn', 'nextBtn'],
    components: {
      Counter,
    },
  };

  onPrevBtnClick() {
    this.$children.Counter.forEach((instance) => instance.goPrev());
  }

  onNextBtnClick() {
    this.$children.Counter.forEach((instance) => instance.goNext());
  }
}

export default createApp(App);
