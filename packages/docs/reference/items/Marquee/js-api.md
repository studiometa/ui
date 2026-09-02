---
title: Marquee JS API
outline: deep
---

# JS API

The `Marquee` component declares the `in-view:50%` [mount strategy](/guide/autoloading/#mount-strategies), so it mounts half a viewport before it scrolls in and unmounts once it is that far past — a marquee never asks for a frame while it is off screen. Override the margin per element with `data-mount="in-view:<rootMargin>"`.

Under [autoloading](/guide/autoloading/), the manifest entry loads the chunk eagerly; once the class is loaded, its own `in-view:50%` strategy governs mounting. An element's `data-mount` always wins over both.

## Custom properties

The component paints nothing. Each frame it writes three custom properties on its own element and leaves the meaning to CSS.

| Property             | Type      | Meaning                                                                  |
| -------------------- | --------- | ------------------------------------------------------------------------ |
| `--marquee-progress` | `0…1`     | The travel, wrapped. It reaches `1` and starts again from `0`.           |
| `--marquee-offset`   | unbounded | The same travel, unwrapped and signed. `2.5` is two loops and a half.    |
| `--marquee-velocity` | signed    | The damped travel rate, in loops per second. Idle it settles on `speed`. |

`--marquee-offset` counts loops, not pixels: a pixel figure would need the element measured, which is exactly the read this component does without.

`--marquee-velocity` is published raw, so clamp it in CSS if a fast scroll must not overdrive the effect that reads it:

```css
.skewed {
  transform: translateX(calc(var(--marquee-progress) * -100%))
    skewX(clamp(-15deg, calc(var(--marquee-velocity) * 3deg), 15deg));
}
```

The writes are skipped on a frame where nothing moved, so a marquee at rest costs a read and no style invalidation.

## Options

### `speed`

- Type: `number`
- Default: `0.1`

The travel while the page is still, in **loops per second**. `0.1` is one loop every ten seconds; `0` makes the marquee move only while the page scrolls.

v1 hid this inside a magic `+ 1` in `(Math.abs(deltaY) + 1) * sensitivity`, which tied the idle speed to the scroll multiplier and to the refresh rate at once. The two are separate options now, and both are per second.

### `sensitivity`

- Type: `number`
- Default: `0.001`

How much the scroll boosts the travel, in **loops per pixel scrolled**. `0.001` is one extra loop per 1000 px of scroll. A negative value reverses the direction of the whole marquee, idle travel included, the way v1's did.

### `damping`

- Type: `number`
- Default: `0.25`

How fast the published travel catches up with the accumulated one. Lower is smoother and lags more; `1` follows the scroll with no smoothing at all. It was hardcoded at `0.25` in v1.

::: tip Frame-rate independent
The smoothing is time-based: each frame feeds its elapsed milliseconds into `damp()`, so `damping` describes the same settling time and `speed` the same travel per second on a 60 Hz and on a 120 Hz display. In v1 the damping was applied per frame, which made the effective speed depend on the refresh rate.
:::

## Reduced motion

Under `prefers-reduced-motion: reduce`, **the idle travel stops and the scroll-driven travel continues.**

Continuous idle motion is decorative motion nobody asked for, which is what the setting is about — and what [WCAG 2.2 SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) asks to be pausable. Travel driven by the scroll delta is the user's own gesture: it advances only while they scroll and stops when they stop, so removing it would answer "less motion" by breaking the page instead. Neither v1 component honoured the setting at all.

The query is read through the toolkit's [`usePrefersReducedMotion()`](https://js-toolkit-v4.studiometa.dev/api/services/usePrefersReducedMotion.html) service and stays subscribed, so turning the setting on mid-session stops the idle travel of a marquee that is already mounted.

## Properties

### `offset`

- Type: `number`

The raw travel, in loops, unwrapped and unbounded. The scroll and the idle speed accumulate here.

### `dampedOffset`

- Type: `number`

The damped travel, which is what `--marquee-offset` publishes and what `--marquee-progress` wraps.

### `velocity`

- Type: `number`

The damped travel rate, in loops per second, signed. It is derived from what `dampedOffset` actually moved on the frame, so it can never disagree with the position.

### `deltaY`

- Type: `number`

The scroll distance seen since the last frame, in pixels. Each frame consumes it, so it returns to `0` on its own once the page stops scrolling.

## Extending

`Marquee` composes the `withRaf` and `withScroll` mixins, each of which binds its subscription from `mounted()`. A subclass that overrides `mounted()` **must** return `super.mounted()`, or the component silently subscribes to nothing.

```js
mounted() {
  // your setup
  return super.mounted();
}
```
