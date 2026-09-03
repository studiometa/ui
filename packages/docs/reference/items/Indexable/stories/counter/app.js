import { Base, registerComponent } from '@studiometa/js-toolkit';
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
    for (const instance of this.$query('Counter')) instance.goPrev();
  }

  onNextBtnClick() {
    for (const instance of this.$query('Counter')) instance.goNext();
  }
}

registerComponent(App);
