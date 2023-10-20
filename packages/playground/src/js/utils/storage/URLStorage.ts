import { historyReplace } from '@studiometa/js-toolkit/utils';
import { zip, unzip } from '../zip.js';
import { StorageInterface } from './StorageInterface.js';
import { AbstractStorage } from './AbstractStorage.js';

export class URLStorage
  extends AbstractStorage<URLSearchParams>
  implements StorageInterface<string>
{
  get(key: string): string | null {
    return this.store.has(key) ? unzip(this.store.get(key)) : null;
  }

  set(key: string, value: string): void {
    this.store.set(key, zip(value));
    historyReplace({ search: this.store });
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
