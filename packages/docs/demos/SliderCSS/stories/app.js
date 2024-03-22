import { Base, createApp } from '@studiometa/js-toolkit';
import { compute } from 'https://esm.sh/compute-scroll-into-view';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['wrapper', 'items[]', 'prev', 'next'],
  };

  index = 0;

  get prevIndex() {
    return Math.max(this.index - 1, 0);
  }

  get nextIndex() {
    return Math.min(this.index + 1, this.lastIndex);
  }

  get lastIndex() {
    return this.$refs.items.length - 1;
  }

  mounted() {
    this.goTo(this.index);
  }

  onItemsClick(event, index) {
    this.goTo(index);
  }

  goPrev() {
    this.goTo(this.prevIndex);
  }

  goNext() {
    this.goTo(this.nextIndex);
  }

  goTo(index) {
    this.index = index;
    const currentItem = this.$refs.items[index];
    this.$refs.items.forEach(item => {
      const method = item === currentItem ? 'add' : 'remove';
      item.classList[method]('ring');
    })
    const action = compute(currentItem, { block: 'nearest', inline: 'center' }).find((action) => action.el === this.$refs.wrapper);
    if (action) {
      action.el.scrollTo({ left: action.left, behavior: 'smooth' });
    }
  }

  resized() {
    this.goTo(this.index);
  }

  onPrevClick() {
    this.goPrev();
  }

  onNextClick() {
    this.goNext();
  }
}

createApp(App)
