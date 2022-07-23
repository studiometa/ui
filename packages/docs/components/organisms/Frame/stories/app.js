import { Base, createApp } from '@studiometa/js-toolkit';
import { Frame } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Frame,
    },
  };
}

class FakeLink extends HTMLElement {
  constructor() {
    super();

    this.link = document.createElement('a');
  }

  get href() {
    const href = this.getAttribute('href');
    this.link.setAttribute('href', href);

    return this.link.href.replace(/\.html$/, '.txt');
  }
}
try {
  customElements.define('fake-link', FakeLink);
} catch (err) {
  // silence is golden.
}

export default createApp(App);
