export interface StorageInterface<U = unknown> {
  get(key: string): U | undefined;
  set(key: string, value: U): void;
  has(key: string): boolean;
  delete(key: string): void;
}
