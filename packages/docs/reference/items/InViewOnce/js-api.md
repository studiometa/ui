---
title: InViewOnce JS API
---

# JS API

The `InViewOnce` class extends the [`InView` primitive](/reference/items/InView/js-api.html). As it inherits its API, make sure to have a look at its own API reference too. Unlike `InView`, it emits `in-view` only once and never emits `out-of-view`.

## Events

### `in-view`

Emitted once, when the element first enters the viewport. `InViewOnce` declares the `visible` mount strategy, which mounts and never unmounts, and it suppresses `out-of-view`, so the event never fires again.

```js
onInViewOnceInView() {
  // the element entered the viewport for the first time
}
```

## Options

`InViewOnce` declares none. The viewport margin belongs to the mount strategy, so it is written on the `data-mount` attribute as the strategy's suffix — the value becomes the [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#options) `rootMargin`:

```html
<div data-component="InViewOnce" data-mount="visible:100px">...</div>
```

## See also

- The [`InView` primitive](/reference/items/InView/) is the repeating counterpart: it emits `in-view` and `out-of-view` on every viewport crossing.
- The [`Sentinel` primitive](/reference/items/Sentinel/) emits a single, non-directional `intersected` event on both enter and leave.
