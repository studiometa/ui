import { domScheduler } from '@studiometa/js-toolkit/utils';
import { fallbackStore as store } from '../utils/storage/index.js';

export type Layouts = 'top' | 'right' | 'bottom' | 'left';

const layouts = new Set<Layouts>(['top', 'right', 'bottom', 'left']);
const defaultLayout = 'top';

const callbacks = [];

export function getLayout(): Layouts {
  return (store.get('layout') || defaultLayout) as Layouts;
}

export function layoutIs(position: Layouts) {
  return getLayout() === position;
}

export function layoutIsVertical() {
  const layout = getLayout();
  return layout === 'left' || layout === 'right';
}

export function layoutIsHoritontal() {
  const layout = getLayout();
  return layout === 'top' || layout === 'bottom';
}

export function layoutUpdateDOM(value: Layouts = getLayout()) {
  domScheduler.write(() => {
    document.documentElement.classList.toggle('is-top', value === 'top');
    document.documentElement.classList.toggle('is-right', value === 'right');
    document.documentElement.classList.toggle('is-bottom', value === 'bottom');
    document.documentElement.classList.toggle('is-left', value === 'left');
  });
}

export function setLayout(value: Layouts = getLayout()) {
  if (!layouts.has(value)) {
    console.log(`The "${value}" layout is not valid.`);
    // eslint-disable-next-line no-param-reassign
    value = defaultLayout;
  }
  store.set('layout', value);
  layoutUpdateDOM(value);
  callbacks.forEach((callback) => callback(value));
}

export function watchLayout(callback) {
  const index = callbacks.length;
  callbacks.push(callback);

  return () => {
    callbacks.splice(index, 1);
  };
}
