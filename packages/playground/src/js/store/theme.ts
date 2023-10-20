import { domScheduler } from '@studiometa/js-toolkit/utils';
import { fallbackStore as store } from '../utils/storage/index.js';

export type Themes = 'dark' | 'light';

const themes = new Set<Themes>(['dark', 'light']);
const defaultTheme = 'light';

const themeCallbacks = [];

export function getTheme(): Themes {
  return (store.get('theme') || defaultTheme) as Themes;
}

export function themeIsDark() {
  return getTheme() === 'dark';
}

export function themeIsLight() {
  return getTheme() === 'light';
}

export function themeUpdateDOM(value: Themes = getTheme()) {
  domScheduler.write(() => {
    document.documentElement.classList.toggle('dark', value === 'dark');
  });
}

export function setTheme(value: Themes = getTheme()) {
  if (!themes.has(value)) {
    console.warn(`The "${value}" theme is not valid.`);
    // eslint-disable-next-line no-param-reassign
    value = defaultTheme;
  }

  store.set('theme', value);
  themeUpdateDOM(value);
  themeCallbacks.forEach((callback) => callback(value));
}

export function watchTheme(callback) {
  const index = themeCallbacks.length;
  themeCallbacks.push(callback);

  return () => {
    themeCallbacks.splice(index, 1);
  };
}
