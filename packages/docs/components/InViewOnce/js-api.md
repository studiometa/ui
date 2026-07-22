---
title: InViewOnce JS API
---

# JS API

The `InViewOnce` class extends the [`InView` primitive](/components/InView/js-api.html). As it inherits its API, make sure to have a look at its own API reference too. Unlike `InView`, it emits `in-view` only once and never emits `out-of-view`.

## Events

### `in-view`

Emitted once, when the element first enters the viewport. The component then terminates and disconnects its observer, so the event never fires again.

```js
onInViewOnceInView() {
  // the element entered the viewport for the first time
}
```

## Options

### `intersectionObserver`

- Type: `object`
- Default: `{ threshold: [0, 1] }`

Options forwarded to the underlying [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#options) instance created by the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). Use it to adjust the `rootMargin`, `threshold` or `root` used to detect the viewport crossing.

```html
<div data-component="InViewOnce" data-option-intersection-observer='{ "rootMargin": "100px" }'>
  ...
</div>
```

## See also

- The [`InView` primitive](/components/InView/) is the repeating counterpart: it emits `in-view` and `out-of-view` on every viewport crossing.
- The [`Sentinel` primitive](/components/Sentinel/) emits a single, non-directional `intersected` event on both enter and leave.
