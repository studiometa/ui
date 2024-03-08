import { Base, createApp } from '@studiometa/js-toolkit';
import { wait } from '@studiometa/js-toolkit/utils';

class Share extends Base {
  static config = {
    name: 'Share',
  };

  async onClick() {
    navigator.clipboard.writeText(window.parent?.location.href);
    const { textContent } = this.$el;
    this.$el.disabled = true;
    this.$el.textContent = 'URL copiée dans votre clipboard !';
    await wait(1000);
    this.$el.textContent = textContent;
    this.$el.disabled = false;
  }
}

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Share,
    },
  };
}

createApp(App);
