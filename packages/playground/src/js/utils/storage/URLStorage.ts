import { historyReplace } from '@studiometa/js-toolkit/utils';
import { StorageInterface } from './StorageInterface.js';
import { AbstractStorage } from './AbstractStorage.js';

export class URLStorage
  extends AbstractStorage<URLSearchParams>
  implements StorageInterface<string>
{
  get(key: string): string | null {
    return this.store.get(key);
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
    historyReplace({ search: this.store });
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
