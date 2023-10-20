import { zip, unzip } from '../zip.js';
import { StorageInterface } from './StorageInterface.js';
import { AbstractStorage } from './AbstractStorage.js';

export class ZipStorage
  extends AbstractStorage<StorageInterface<string>>
  implements StorageInterface<string>
{
  get(key: string): string | null {
    const value = this.store.get(key);

    if (value) {
      return unzip(value);
    }

    return value;
  }

  set(key: string, value: string): void {
    this.store.set(key, zip(value));
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}
