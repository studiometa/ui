export class AbstractStorage<T> {
  store: T;

  constructor(store: T) {
    this.store = store;
  }
}
