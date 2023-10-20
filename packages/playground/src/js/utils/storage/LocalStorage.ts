import { isString } from '@studiometa/js-toolkit/utils';
import { StorageInterface } from './StorageInterface.js';
import { AbstractStorage } from './AbstractStorage.js';

export class LocalStorage extends AbstractStorage<Storage> implements StorageInterface<string> {
  get(key: string): string | null {
    return this.store.getItem(key);
  }

  set(key: string, value: string): void {
    this.store.setItem(key, value);
  }

  has(key: string): boolean {
    return isString(this.get(key));
  }

  delete(key: string): void {
    this.store.removeItem(key);
  }
}
