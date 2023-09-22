import { domScheduler } from '@studiometa/js-toolkit/utils';

export type Layouts = 'top' | 'right' | 'bottom' | 'left';

const callbacks = [];

export function getLayout(): Layouts {
  return (localStorage.getItem('layout') || 'top') as Layouts;
}

export function layoutIs(position:Layouts) {
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

export function setLayout(value: Layouts) {
  localStorage.setItem('layout', value);
  domScheduler.write(() => {
    document.documentElement.classList.toggle('is-top', value === 'top');
    document.documentElement.classList.toggle('is-right', value === 'right');
    document.documentElement.classList.toggle('is-bottom', value === 'bottom');
    document.documentElement.classList.toggle('is-left', value === 'left');
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
