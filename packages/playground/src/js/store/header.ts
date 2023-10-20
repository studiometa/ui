import { domScheduler } from '@studiometa/js-toolkit/utils';
import { fallbackStore as store } from '../utils/storage/index.js';

export type HeaderVisibility = 'visible' | 'hidden';

const headerVisibilities = new Set(['visible', 'hidden']);
const defaultHeaderVisibility = 'visible';

const key = 'header';
const callbacks: Array<(value: HeaderVisibility) => unknown> = [];

export function getHeaderVisibility(): HeaderVisibility {
  return (store.get(key) || defaultHeaderVisibility) as HeaderVisibility;
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

export function headerUpdateDOM(value: HeaderVisibility = getHeaderVisibility()) {
  domScheduler.write(() => {
    document.documentElement.classList.toggle('has-header', value === 'visible');
  });
}

export function setHeaderVisibility(value: HeaderVisibility = getHeaderVisibility()) {
  if (!headerVisibilities.has(value)) {
    console.warn(`The "${value}" header visibility is not valid.`);
    // eslint-disable-next-line no-param-reassign
    value = defaultHeaderVisibility;
  }
  store.set(key, value);
  headerUpdateDOM(value);
  callbacks.forEach((callback) => callback(value));
}

export function watchHeaderVisibility(callback: (value: HeaderVisibility) => unknown) {
  const index = callbacks.length;
  callbacks.push(callback);

  return () => {
    callbacks.splice(index, 1);
  };
}
