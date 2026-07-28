---
title: Carousel JS API
outline: deep
---

# JS API

The `Carousel` class extends the [`Indexable` primitive](/components/Indexable/). It inherits its index-navigation methods (`goTo()`, `goNext()`, `goPrev()`), its `boundary` and `reverse` options and its `index` event, so make sure to have a look at [its API reference](/components/Indexable/js-api) too.

A carousel is composed of several components working together:

- `Carousel` — the root component, extending `Indexable`
- `CarouselWrapper` — the scrollable container holding the items
- `CarouselItem` — a single slide
- `CarouselBtn` — a previous, next or go-to control
- `CarouselDrag` — optional pointer-drag behavior, mounted only on fine-pointer devices

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

Inherited from the [`Indexable`](/components/Indexable/js-api#boundary) primitive, it controls what happens at the ends of the track: `clamp` stops at the first/last item, `loop` wraps around, and `bounce` reverses direction. The `CarouselBtn` controls follow it — `prev`/`next` disable at the ends in `clamp` mode but stay active in `loop` and `bounce`. See the [boundaries example](./examples#boundaries).

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Carousel"
  data-option-boundary="loop">
  ...
</div>
```
<!-- prettier-ignore-end -->

The [`reverse`](/components/Indexable/js-api#reverse) option is also inherited from `Indexable`. The `total` option has no effect here: the carousel derives its length from the number of `CarouselItem` children.

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

Scroll to the given item. Accepts an index or one of the [`Indexable` instructions](/components/Indexable/js-api). The `goNext()` and `goPrev()` shortcuts are inherited from the primitive.

## Events

### `progress`

Emitted while the carousel scrolls, with the current progress between `0` and `1`. The same value is reflected on the root element through the [`--carousel-progress`](#carousel-progress) custom property.

```js
onCarouselProgress(progress) {
  // progress is a number between 0 and 1
}
```

The `index` event is inherited from the [`Indexable` primitive](/components/Indexable/js-api) and emitted whenever the current index changes.

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

Adds pointer-drag navigation to the wrapper, built with the [`withDrag`](https://js-toolkit.studiometa.dev/api/decorators/withDrag.html) and [`withMountOnMediaQuery`](https://js-toolkit.studiometa.dev/api/decorators/withMountOnMediaQuery.html) decorators. It only mounts on fine-pointer devices (`(pointer: fine)`), leaving native CSS scroll-snap to handle touch devices. Apply it to the same element as `CarouselWrapper`.
