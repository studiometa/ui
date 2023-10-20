import { StorageInterface } from './StorageInterface.js';

export class MultiStorage<T = unknown> implements StorageInterface<T> {
  stores: Array<StorageInterface<T>>;

  constructor(stores: Array<StorageInterface<T>>) {
    this.stores = stores;
  }

  get(key: string): T | undefined {
    const values = new Set(this.stores.map((store) => store.get(key)));

    if (values.size > 1) {
      console.warn('Value mismatch in MultiStorage.', Array.from(values));
    }

    return Array.from(values).shift();
  }

  set(key: string, value: T): void {
    this.stores.forEach((store) => store.set(key, value));
  }

  has(key: string): boolean {
    return this.stores.every((store) => store.has(key));
  }

  delete(key: string): void {
    this.stores.forEach((store) => store.delete(key));
  }
}
