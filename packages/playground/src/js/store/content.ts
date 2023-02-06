import { historyReplace } from '@studiometa/js-toolkit/utils';
import { zip, unzip } from '../utils/zip.js';

const { location } = window;

if (location.hash && !location.search) {
  try {
    const search = new URLSearchParams(location.hash.slice(1));
    historyReplace({ search });
    location.hash = '';
  } catch {
    // Silence is golden.
  }
}

const store = new URLSearchParams(location.search || location.hash.slice(1));

const storeSetter = store.set.bind(store);
const storeGetter = store.get.bind(store);

store.get = (key): string | null => {
  return store.has(key) ? unzip(storeGetter(key)) : null;
};

store.set = (key, value) => {
  storeSetter(key, zip(value));
  historyReplace({ search: store });
};

export function getScript() {
  return (
    store.get('script') ??
    `import { Base, createApp } from 'https://cdn.skypack.dev/@studiometa/js-toolkit';

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
  store.set('script', value);
}

export function getHtml() {
  return (
    store.get('html') ??
    `{% html_element 'div' with { class: 'p-10' } %}
	Hello world!
{% end_html_element %}`
  );
}

export function setHtml(value) {
  store.set('html', value);
}
