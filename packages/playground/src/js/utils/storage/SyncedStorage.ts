import { StorageInterface } from './StorageInterface.js';
import { AbstractStorage } from './AbstractStorage.js';

export class SyncedStorage<
    T extends StorageInterface<V>,
    U extends StorageInterface<V>,
    V = unknown,
  >
  extends AbstractStorage<T>
  implements StorageInterface<V>
{
  childStore: U;

  constructor(store: T, childStore: U) {
    super(store);
    this.childStore = childStore;
  }

  get(key: string): V | null {
    const value = this.store.get(key);

    if (this.childStore.get(key) !== value) {
      this.childStore.set(key, value);
    }

    return value;
  }

  set(key: string, value: V): void {
    this.store.set(key, value);
    this.childStore.set(key, value);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
    this.childStore.delete(key);
  }
}
