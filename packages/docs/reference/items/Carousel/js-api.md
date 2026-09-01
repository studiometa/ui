---
title: Carousel JS API
outline: deep
---

# JS API

The `Carousel` class extends the [`Indexable` primitive](/reference/items/Indexable/). It inherits its index-navigation methods (`goTo()`, `goNext()`, `goPrev()`), its `boundary` and `reverse` options and its `index` event, so make sure to have a look at [its API reference](/reference/items/Indexable/js-api) too.

A carousel is composed of several components working together:

- `Carousel` — the root component, extending `Indexable`
- `CarouselWrapper` — the scrollable container holding the items
- `CarouselItem` — a single slide
- `CarouselBtn` — a previous, next or go-to control
- `CarouselDrag` — optional pointer-drag behavior, mounted only on fine-pointer devices
- `CarouselPlay` — optional rotation control, which rotates the carousel on a timer

## Options

### `axis`

- Type: `'x' | 'y'`
- Default: `'x'`

Defines the scroll direction of the carousel: `'x'` for horizontal, `'y'` for vertical.

<!-- prettier-ignore-start -->
```html {2}
<div
  data-component="Carousel"
  data-option-axis="y">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `boundary`

- Type: `'clamp' | 'loop' | 'bounce'`
- Default: `'clamp'`

Inherited from the [`Indexable`](/reference/items/Indexable/js-api#boundary) primitive, it controls what happens at the ends of the track: `clamp` stops at the first/last item, `loop` wraps around, and `bounce` reverses direction. The `CarouselBtn` controls follow it — `prev`/`next` disable at the ends in `clamp` mode but stay active in `loop` and `bounce`. See the [boundaries example](./examples#boundaries).

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Carousel"
  data-option-boundary="loop">
  ...
</div>
```
<!-- prettier-ignore-end -->

The [`reverse`](/reference/items/Indexable/js-api#reverse) option is also inherited from `Indexable`. The `total` option has no effect here: the carousel derives its length from the number of `CarouselItem` children.

## Getters

### `isHorizontal`

- Type: `boolean`

Whether the carousel scrolls horizontally (the `axis` option is `'x'`).

### `isVertical`

- Type: `boolean`

Whether the carousel scrolls vertically (the `axis` option is `'y'`).

### `items`

- Type: `CarouselItem[]`

The carousel's item components.

### `length`

- Type: `number`

The number of items, used as the `Indexable` length.

### `wrapper`

- Type: `CarouselWrapper`

The scrollable wrapper component.

### `progress`

- Type: `number`

The current scroll progress, between `0` and `1`.

## Methods

### `goTo(indexOrInstruction)`

- Arguments: `number | 'next' | 'previous' | 'first' | 'last' | 'random'`
- Returns: `Promise<void>`

Scroll to the given item. Accepts an index or one of the [`Indexable` instructions](/reference/items/Indexable/js-api). The `goNext()` and `goPrev()` shortcuts are inherited from the primitive.

## Events

### `progress`

Emitted while the carousel scrolls, with the current progress between `0` and `1`. The same value is reflected on the root element through the [`--carousel-progress`](#carousel-progress) custom property.

```js
onCarouselProgress(progress) {
  // progress is a number between 0 and 1
}
```

The `index` event is inherited from the [`Indexable` primitive](/reference/items/Indexable/js-api) and emitted whenever the current index changes.

## CSS custom properties

### `--carousel-progress`

Set on the root `Carousel` element, reflects the scroll progress between `0` and `1`.

### `--carousel-item-active`

Set on each `CarouselItem`, equals `1` when the item is the current one and `0` otherwise. Use it to style the active slide.

## CarouselBtn

A control button, delegating to the parent carousel on click.

### `action`

- Type: `'next' | 'prev' | string`

Use `next` or `prev` to step through the items, or a numeric string (e.g. `"2"`) to jump to a specific index. The button disables itself automatically when its action is unavailable, e.g. `prev` on the first item or `next` on the last one.

<!-- prettier-ignore-start -->
```html {3}
<button
  type="button"
  data-component="CarouselBtn"
  data-option-action="next">
  Next
</button>
```
<!-- prettier-ignore-end -->

## CarouselDrag

Adds pointer-drag navigation to the wrapper, built with the [`withDrag` mixin](https://js-toolkit-v4.studiometa.dev) and the `media:(pointer: fine)` [mount strategy](/guide/autoloading/#mount-strategies). It only mounts on fine-pointer devices, leaving native CSS scroll-snap to handle touch devices. Apply it to the same element as `CarouselWrapper`.

While a gesture is running, the track's `scroll-snap-type` is set to `none` — a snapping track cannot be moved to a position that is not a snap point — and restored once the settle scroll has finished.

### How a release settles

The drag service reports the position the throw was heading for, so the track never needs a sensitivity multiplier to guess it. What happens at that projected point depends on how hard the throw was, measured against a threshold of **20% of the scroller, clamped between 50px and 225px**:

- below the threshold, the throw is a **settle**: the carousel goes to the snap point closest to where the throw was heading, which is the current slide when the drag barely moved;
- at or above it, the throw is a **flick**: the carousel goes to **exactly one snap point** from where the pointer let go, in the direction it was travelling.

The one-snap clamp is what keeps a hard flick from crossing the whole track. It is measured from the release position, not from the slide the gesture started on: the drag itself already moved the track pixel for pixel with the pointer, so only the throw is clamped.

### `skipSnaps`

- Type: `boolean`
- Default: `false`

Removes the one-snap clamp: every release settles at the snap point closest to its projected end, however many slides away that is.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="CarouselWrapper CarouselDrag"
  data-option-skip-snaps>
  …
</div>
```
<!-- prettier-ignore-end -->

## CarouselPlay

The rotation control of an auto-rotating carousel: a `<button>` that advances the carousel on a timer and lets the user stop it. **A carousel never rotates unless this element is in the markup.**

It extends [`TimerProgress`](/reference/items/Timer/js-api), so the countdown, its `delay`, `repeat` and `autostart` options, its `pause()` / `resume()` methods, its six `timer-*` events and its per-frame `timer-progress` ratio are the `Timer` primitives, unchanged. Nothing about the timing is re-implemented here.

It is not registered by its parent — register it alongside the carousel, or use [the autoloader](/guide/autoloading/):

```js twoslash [app.js]
import { registerComponents } from '@studiometa/js-toolkit';
import { Carousel, CarouselPlay } from '@studiometa/ui';

registerComponents(Carousel, CarouselPlay);
```

```html
<div data-component="Carousel">
  <button type="button" data-component="CarouselPlay" data-option-delay="5">
    <span data-ref="label"></span>
  </button>
  <div data-component="CarouselWrapper">…</div>
</div>
```

### Accessibility contract

`CarouselPlay` exists because automatic movement fails [WCAG SC 2.2.2 _Pause, Stop, Hide_](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) unless the user can stop it. What it guarantees:

- **The accessible name says what pressing the button will do**, flipping between [`labelStart`](#labelstart) and [`labelStop`](#labelstop). It carries no `aria-pressed`: the name is the state.
- **Hovering the carousel or moving focus into it pauses the rotation, and nothing resumes it.** Tabbing through the slides and out the other side leaves the carousel still.
- **`prefers-reduced-motion: reduce` suppresses the automatic start**, and stops a rotation in flight if the setting is turned on while the page is open. Pressing the button is an explicit request and still works.
- **Activating the control never moves the focus.**

Two things are yours to write, because no component can:

- **Put the button first.** It must be the first focusable element inside the carousel, so a keyboard or screen reader user meets it before the moving content. A `carousel-play.not-first-focusable` warning is reported when it is not.
- **Name the button.** Give it a `label` ref for visible text, or leave it out and the component writes `aria-label` instead.

### `delay`

- Type: `number`
- Default: `5`

How long each slide is shown, **in seconds**. Inherited from [`Timer`](/reference/items/Timer/js-api#delay), whose own default of `0` is a countdown's rather than a carousel's.

### `repeat`

- Type: `boolean`
- Default: `true`

Whether the timer re-arms after each slide. Use `data-option-no-repeat` for a carousel that advances once and stops.

### `autostart`

- Type: `boolean`
- Default: `true`

Whether the rotation starts on mount. Use `data-option-no-autostart` for a carousel that waits to be started.

::: warning
`data-option-autostart="false"` reads as **`true`**. A boolean option reads the _presence_ of its attribute, so the negated `data-option-no-autostart` is the only way to turn a true-default option off.
:::

### `labelStart`

- Type: `string`
- Default: `'Start automatic slide show'`

The accessible name while the rotation is stopped.

### `labelStop`

- Type: `string`
- Default: `'Stop automatic slide show'`

The accessible name while the rotation is running.

### Getters

#### `isPlaying`

- Type: `boolean`

Whether a rotation is currently counting down.

#### `carousel`

- Type: `CarouselApi | undefined`

The carousel this control drives, or `undefined` outside one.

### Methods

#### `rotate()`

Advance the carousel one slide, wrapping back to the first at the end of the track. The wrap is the control's own: the [`boundary`](#boundary) option keeps describing the `CarouselBtn` controls, which should still disable at the ends.

`start()`, `stop()`, `pause()`, `resume()` and `restart()` are inherited from [`Timer`](/reference/items/Timer/js-api).

### Events

Every `timer-*` event is inherited, `timer-progress` included — which is the progress ring, already built. Bind it to the control to show how long the current slide has left:

```html
<div data-component="Carousel">
  <button
    type="button"
    data-component="Action CarouselPlay"
    data-option-delay="5"
    data-on:timer-progress="this.style.setProperty('--progress', event.detail.ratio)">
    <span data-ref="label"></span>
  </button>
  …
</div>
```
