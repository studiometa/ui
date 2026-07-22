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

Emitted when the element leaves the viewport (i.e. when the component is destroyed by the `withMountWhenInView` decorator). By default the element re-emits `in-view` on each re-entry.

```js
onInViewOutOfView() {
  // the element left the viewport
}
```

## Options

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
