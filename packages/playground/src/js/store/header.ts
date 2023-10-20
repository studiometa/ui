import { domScheduler } from '@studiometa/js-toolkit/utils';
import { localStore } from '../utils/storage/index.js';

export type HeaderVisibility = 'visible' | 'hidden';

const key = 'header';
const callbacks: Array<(value: HeaderVisibility) => unknown> = [];

export function getHeaderVisibility(): HeaderVisibility {
  return (localStore.get(key) || 'visible') as HeaderVisibility;
}

export function headerIs(position: HeaderVisibility) {
  return getHeaderVisibility() === position;
}

export function headerIsVisible() {
  return headerIs('visible');
}

export function headerIsHidden() {
  return headerIs('hidden');
}

export function setHeaderVisibility(value: HeaderVisibility) {
  localStore.set(key, value);
  domScheduler.write(() => {
    document.documentElement.classList.toggle('has-header', value === 'visible');
  });
  callbacks.forEach((callback) => callback(value));
}

export function watchHeaderVisibility(callback: (value: HeaderVisibility) => unknown) {
  const index = callbacks.length;
  callbacks.push(callback);

  return () => {
    callbacks.splice(index, 1);
  };
}
