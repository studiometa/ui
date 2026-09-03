---
title: InView JS API
---

# JS API

The `InView` class is a plain [`Base`](https://js-toolkit-v4.studiometa.dev) component declaring the `in-view` mount strategy. The registry owns the observer, so the class holds no state of its own: it emits on mount and on unmount.

## Events

### `in-view`

Emitted when the element enters the viewport, which is when the `in-view` mount strategy mounts the component.

```js
onInViewInView() {
  // the element entered the viewport
}
```

### `out-of-view`

Emitted when the element leaves the viewport, which is when the `in-view` mount strategy unmounts the component. The strategy is reversible, so `in-view` and `out-of-view` re-fire on each re-entry and leave.

If you only care about the first entry, use the [`InViewOnce` variant](/reference/items/InViewOnce/) instead, which emits `in-view` a single time and never emits `out-of-view`.

```js
onInViewOutOfView() {
  // the element left the viewport
}
```

## Options

`InView` declares none. The viewport margin belongs to the mount strategy, not to the component, so it is written on the `data-mount` attribute as the strategy's suffix — the value becomes the [`IntersectionObserver`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#options) `rootMargin`:

```html
<div data-component="InView" data-mount="in-view:100px">...</div>
```

## See also

- The [`Sentinel` primitive](/reference/items/Sentinel/) emits a single, non-directional `intersected` event on both enter and leave. `InView` is its directional counterpart.
