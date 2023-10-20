import { domScheduler } from '@studiometa/js-toolkit/utils';
import { localStore } from '../utils/storage/index.js';

export type Themes = 'dark' | 'light';

const themeCallbacks = [];

export function getTheme(): Themes {
  return (localStore.get('theme') || 'light') as Themes;
}

export function themeIsDark() {
  return getTheme() === 'dark';
}

export function themeIsLight() {
  return getTheme() === 'light';
}

export function setTheme(value: Themes) {
  localStore.set('theme', value);
  domScheduler.write(() => {
    document.documentElement.classList.toggle('dark', value === 'dark');
  });
  themeCallbacks.forEach((callback) => callback(value));
}

export function watchTheme(callback) {
  const index = themeCallbacks.length;
  themeCallbacks.push(callback);

  return () => {
    themeCallbacks.splice(index, 1);
  };
}
