---
title: LargeText JS API
---

# JS API

The `LargeText` component declares the `in-view:50%` [mount strategy](/guide/autoloading/#mount-strategies), so it mounts half a viewport before it scrolls in and unmounts once it is that far past. Override the margin per element with `data-mount="in-view:<rootMargin>"`.

Under [autoloading](/guide/autoloading/), the manifest entry loads the chunk eagerly; once the class is loaded, its own `in-view:50%` strategy governs mounting. An element's `data-mount` always wins over both.

## Options

### `skew`

- Type: `boolean`
- Default: `false`

Enables skew.

### `sensitivity`

- Type: `number`
- Default: `1`

Multiplies the scroll delta that drives the translation, so it sets the travel speed. A negative value reverses the direction; the Twig template lays the repeated copies out to the left when `sensitivity` is negative, so the loop stays seamless either way.

### `skewSensitivity`

- Type: `number`
- Default: `1`

Multiplies the skew angle. The scroll delta is clamped to ±50 before the multiplication, so the multiplier scales a bounded value rather than a raw delta.

::: warning
Remember to enable skew with the `skew` option.
:::

::: tip Frame-rate independent
The smoothing is time-based: each frame feeds the elapsed milliseconds into `damp()`, so `sensitivity` describes the same speed on a 60 Hz and on a 120 Hz display. In v1 the damping was applied per frame, which made the effective speed depend on the refresh rate — a v1 value tuned on a 60 Hz screen now produces the intended motion everywhere.
:::

## Refs

### `target`

- Type: `HTMLElement`

The `LargeText` component should have a ref corresponding to its inner `HTMLElement` element.

## Properties

### `x`

- Type: `number`

The undamped travel, in pixels. The loop resets it once the content has moved its own width.

### `deltaY`

- Type: `number`

The latest vertical scroll delta, which sets the travel speed.

### `transform`

- Type: `{ x: number; skewX: number }`

The damped values written to the target on each frame.

### `width`

- Type: `number`

The target's measured width — the distance one loop covers.

## Methods

### `measure()`

- Returns: `void`

Re-measures `width` from the target's `clientWidth`. It is called on mount and on every resize; call it by hand after changing the content outside a resize.

## Extending

`LargeText` composes the `withRaf`, `withResize` and `withScroll` mixins, each of which binds its subscription from `mounted()`. A subclass that overrides `mounted()` **must** return `super.mounted()`, or the component silently subscribes to nothing.

```js
mounted() {
  // your setup
  return super.mounted();
}
```
