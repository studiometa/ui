let descriptor;

function mockImage(event) {
  descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get() {
      return descriptor.get.call(this);
    },
    set(src) {
      descriptor.set.call(this, src);
      this.dispatchEvent(new Event(event));
    },
  });
}

export function mockImageLoad() {
  mockImage('load');
}

export function mockImageLoadError() {
  mockImage('error');
}

export function unmockImageLoad() {
  if (descriptor) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', descriptor);
  }

  descriptor = null;
}
