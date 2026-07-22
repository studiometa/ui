---
title: InView JS API
---

# JS API

The `InView` class extends the [`Base` class](https://js-toolkit.studiometa.dev/api/) with the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). As it inherits their APIs, make sure to have a look at their own API references too.

## Events

### `in-view`

Emitted when the element enters the viewport (i.e. when the component is mounted by the `withMountWhenInView` decorator).

```js
onInViewInView() {
  // the element entered the viewport
}
```

### `out-of-view`

Emitted when the element leaves the viewport (i.e. when the component is destroyed by the `withMountWhenInView` decorator). Only emitted when the [`repeat` option](#repeat) is enabled — in the default one-shot mode the primitive terminates after the first `in-view` and never emits `out-of-view`.

```js
onInViewOutOfView() {
  // the element left the viewport
}
```

## Options

### `repeat`

- Type: `boolean`
- Default: `false`

Configures whether the primitive should keep reacting to viewport crossings or only fire once.

By default (`repeat: false`), the primitive is **one-shot**: it emits `in-view` a single time when the element first enters the viewport, then terminates — so it never emits `out-of-view` and never re-fires. Enable `repeat` to re-emit `in-view` on each entry and `out-of-view` on each leave.

```html
<div data-component="InView" data-option-repeat>...</div>
```

### `intersectionObserver`

- Type: `object`
- Default: `{ threshold: [0, 1] }`

Options forwarded to the underlying [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#options) instance created by the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). Use it to adjust the `rootMargin`, `threshold` or `root` used to detect the viewport crossing.

```html
<div data-component="InView" data-option-intersection-observer='{ "rootMargin": "100px" }'>
  ...
</div>
```

## See also

- The [`Sentinel` primitive](/components/Sentinel/) emits a single, non-directional `intersected` event on both enter and leave. `InView` is its directional counterpart.
