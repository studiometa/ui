let tmp;

export function mockImageLoad() {
  tmp = global.Image;
  global.Image = class extends tmp {
    set src(src) {
      this.setAttribute('src', src);
      this.dispatchEvent(new Event('load'));
    }
  }
}

export function unmockImageLoad() {
  if (tmp) {
    global.Image = tmp;
  }

  tmp = null;
}
