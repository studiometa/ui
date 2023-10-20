import { StorageInterface } from './StorageInterface.js';
import { AbstractStorage } from './AbstractStorage.js';

export class FallbackStorage<
    T extends StorageInterface<V>,
    U extends StorageInterface<V>,
    V = unknown,
  >
  extends AbstractStorage<T>
  implements StorageInterface<V>
{
  fallbackStore: U;

  constructor(store: T, fallbackStore: U) {
    super(store);
    this.fallbackStore = fallbackStore;
  }

  get(key: string): V | null {
    return this.store.get(key) ?? this.fallbackStore.get(key);
  }

  set(key: string, value: V): void {
    this.store.set(key, value);
    this.fallbackStore.set(key, value);
  }

  has(key: string): boolean {
    return this.store.has(key) || this.fallbackStore.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
    this.fallbackStore.delete(key);
  }
}
