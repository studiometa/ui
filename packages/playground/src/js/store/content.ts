import { historyReplace } from '@studiometa/js-toolkit/utils';
import { urlStore } from '../utils/storage/index.js';

// Legacy migration from hash to search
if (window.location.hash && !window.location.search) {
  try {
    const search = new URLSearchParams(window.location.hash.slice(1));
    historyReplace({ search });
    window.location.hash = '';
  } catch {
    // Silence is golden.
  }
}

export function getScript() {
  return (
    urlStore.get('script') ??
    `import { Base, createApp } from '@studiometa/js-toolkit';
// import {  } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
  };
}

createApp(App)
`
  );
}

export function setScript(value) {
  urlStore.set('script', value);
}

export function getHtml() {
  return (
    urlStore.get('html') ??
    `{% html_element 'div' with { class: 'p-10' } %}
  Hello world!
{% end_html_element %}`
  );
}

export function setHtml(value) {
  urlStore.set('html', value);
}
