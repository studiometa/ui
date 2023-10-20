import { URLStorage } from './URLStorage.js';
import { LocalStorage } from './LocalStorage.js';
import { SyncedStorage } from './SyncedStorage.js';
import { FallbackStorage } from './FallbackStorage.js';
import { ZipStorage } from './ZipStorage.js';

export const urlStore = new URLStorage(
  new URLSearchParams(window.location.search || window.location.hash.slice(1)),
);
export const zipUrlStore = new ZipStorage(urlStore);
export const localStore = new LocalStorage(window.localStorage);
export const syncedStore = new SyncedStorage(urlStore, localStore);
export const fallbackStore = new FallbackStorage(urlStore, localStore);
