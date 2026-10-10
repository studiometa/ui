---
title: Sheet JS API
outline: deep
---

# JS API

The `Sheet` component uses the [`withInView`](https://js-toolkit-v4.studiometa.dev/api/services/mixins.html) and [`withRaf`](https://js-toolkit-v4.studiometa.dev/api/services/mixins.html) mixins of the [`@studiometa/js-toolkit` package](https://js-toolkit-v4.studiometa.dev) and implements the [`Transitionable`](/reference/items/Transition/) contract that [`Dialog`](/reference/items/Dialog/) calls.

## Options

### `position`

- Type: `'bottom'`
- Default: `'bottom'`

The viewport edge the sheet is attached to. Only `bottom` is implemented. Any other value logs a [`sheet.unsupported-position`](#diagnostics) warning, and the sheet behaves as a `bottom` sheet. The option keeps the markup of a bottom sheet stable when the other positions are added.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Sheet"
  data-option-position="bottom">
  ...
</div>
```
<!-- prettier-ignore-end -->

## Refs

### `panel`

- Type: `HTMLElement`

The sheet itself, inside the stage. It declares the `--sheet` view timeline, and the `IntersectionObserver` that detects a swipe out watches it.

## Properties

### `panel`

- Type: `HTMLElement`

A getter returning the [`panel` ref](#panel).

### `progress`

- Type: `number`

How far the panel has entered the visible half of the scroller, from `0` (out of view) to `1` (fully in view). It is what the `entry` range of the `--sheet` timeline measures, and what [`--sheet-progress`](#sheet-progress) publishes. It is measured from layout, so a transform on the panel does not change it.

### `state`

- Type: `'entering' | 'leaving' | null`

The direction of the last `enter()` or `leave()` call, `null` before the first one.

## Methods

### `enter`

- Returns `Promise<void>`

Scroll to the end of the scroll range, which puts the panel fully on screen. Resolves on `scrollend`, at once when the scroll lands at once, and after one second when no `scrollend` arrives. Scrolls instantly under `prefers-reduced-motion: reduce`. `Dialog` calls it on open.

### `leave`

- Returns `Promise<void>`

Scroll back to `0`, which puts the panel off screen. Resolves on `scrollend`. Resolves at once when the panel is already out of view, after it jumps to `0` if a swipe is still settling. Scrolls instantly under `prefers-reduced-motion: reduce`. `Dialog` calls it on close.

### `toggle`

- Returns `Promise<void>`

Call `leave()` if the last call was `enter()`, `enter()` otherwise.

## Timeline and custom properties

### `--sheet`

A [view timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/view-timeline) declared on the `panel`, with `view-timeline-inset: 0 100dvh` so that it tracks the visible half of the scroller. `timeline-scope: --sheet` on the root element makes it available to every element of the sheet. Animate with `animation-timeline: --sheet` and `animation-range: entry`.

### `--sheet-progress`

Set on the root element **only** where `animation-timeline: view()` is not supported. It equals [`progress`](#progress), from `0` to `1`, and follows every scroll.

## Diagnostics

Every one is a development-only warning on the [toolkit diagnostic channel](https://js-toolkit-v4.studiometa.dev/).

| Code                         | Meaning                                                       |
| ---------------------------- | ------------------------------------------------------------- |
| `sheet.unsupported-position` | The `position` option has a value this version does not know. |

## Events

The `Sheet` emits no events of its own. Listen to the extendable `open` and `close` events of its parent [`Dialog`](/reference/items/Dialog/js-api#events).
