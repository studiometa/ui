import { domScheduler } from '@studiometa/js-toolkit/utils';

export type Layouts = 'vertical' | 'horizontal';

const callbacks = [];

export function getLayout(): Layouts {
  return (localStorage.getItem('layout') || 'horizontal') as Layouts;
}

export function layoutIsVertical() {
  return getLayout() === 'vertical';
}

export function layoutIsHoritontal() {
  return getLayout() === 'horizontal';
}

export function setLayout(value: Layouts) {
  localStorage.setItem('layout', value);
  domScheduler.write(() => {
    document.documentElement.classList.toggle('is-vertical', value === 'vertical');
  });
  callbacks.forEach((callback) => callback(value));
}

export function watchLayout(callback) {
  const index = callbacks.length;
  callbacks.push(callback);

  return () => {
    callbacks.splice(index, 1);
  };
}
