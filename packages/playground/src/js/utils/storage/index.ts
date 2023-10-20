import { URLStorage } from './URLStorage.js';
import { LocalStorage } from './LocalStorage.js';
import { MultiStorage } from './MultiStorage.js';

export const urlStore = new URLStorage(
  new URLSearchParams(window.location.search || window.location.hash.slice(1)),
);

export const localStore = new LocalStorage(window.localStorage);

export const multiStore = new MultiStorage([urlStore, localStore]);
