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

### `slide-label`

- Type: `string`
- Default: `'{index} of {total}'`

The template for the accessible name a slide falls back to when it has no `aria-label` or `aria-labelledby` of its own. `{index}` is the slide's one-based position, `{total}` the live slide count — appending a slide rewrites every name.

<!-- prettier-ignore-start -->
```html {3}
<div
  data-component="Carousel"
  data-option-slide-label="Diapositive {index} sur {total}">
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

### `slideLabel(index, total)`

- Arguments: `number`, `number`
- Returns: `string`

The accessible name of the slide at a zero-based `index`, built from the [`slide-label`](#slide-label) option. `CarouselItem` calls it; it is on the API so a control never has to reach back for the option.

### `syncPresence()`

- Returns: `void`

Rebuild the observer that decides which slides are presented, and re-apply `inert` to the ones that do not intersect the track. Called on mount and whenever a slide or the track arrives or leaves. Call it yourself only if you resize the track without a `ResizeObserver` noticing.

## Diagnostics

Both are development-only warnings on the [toolkit diagnostic channel](https://js-toolkit-v4.studiometa.dev/).

| Code                   | Meaning                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| `carousel.unnamed`     | The root has neither an `aria-label` nor an `aria-labelledby`.         |
| `carousel.unnamed-btn` | A `CarouselBtn` has no text, no `aria-label` and no `aria-labelledby`. |

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

Use `next` or `prev` to step through the items, or a numeric string (e.g. `"2"`) to jump to a specific index. The button marks itself unavailable when its action would not move the index — `prev` on the first item, `next` on the last one, a picker for the slide already showing.

**How it does so depends on which button it is.** A `prev`/`next` button gets the native `disabled` property. A picker gets `aria-disabled="true"` instead and stays focusable, which is what the APG's grouped-buttons variant asks for: the picker for the current slide is the one a screen reader user looks for, and `disabled` would take it out of the accessibility tree every time the carousel moves. Clicking an `aria-disabled` picker does nothing.

Pickers stay plain buttons — no `role="tab"`, no `role="tablist"`, no `aria-selected`. The APG prescribes tab semantics for them and every piece of user testing published since contradicts it; the objection has been open on the APG repository, unanswered, for eight years.

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

## CarouselWrapper

The scroll track. It scrolls to a slide on demand and reports the closest one back; it also owns the two accessibility properties that belong to a scroll container.

### `scrollBehavior`

- Type: `'smooth' | 'instant'`

How a programmatic scroll animates. `instant` under `prefers-reduced-motion: reduce`, `smooth` otherwise. The media query is watched, not sampled once, so changing the system setting takes effect on the next `goTo()`.

### `syncAccessibility()`

- Returns: `void`

Probe the track for focusable content and add or remove its own tab stop accordingly. A scroll container the keyboard cannot reach fails WCAG 2.1.1, and the platform only half fixes it: Chrome makes a scroller focusable only when it has no focusable children, Firefox makes every scroller a tab stop, Safari has not implemented it. When the probe finds nothing focusable the track gets `tabindex="0"`, a `role` and the carousel's name; when a slide brings a link, all three are given back. `tabindex="-1"` is never written.

Called on mount, on a resize and whenever the slide list changes.

### `syncScrollPadding()`

- Returns: `void`

Mirror the track's own `padding` into its `scroll-padding`, on the sides the author left at `auto`. The scrollport of a scroll container is its padding box, so without this a focused item lands flush against the border edge, under whatever the padding was reserving — the case WCAG 2.2 SC 2.4.11 Focus Not Obscured covers, and `scroll-padding` is its sufficient technique.

## CarouselDrag

Adds pointer-drag navigation to the wrapper, built with the [`withDrag` mixin](https://js-toolkit-v4.studiometa.dev) and the `media:(pointer: fine)` [mount strategy](/guide/autoloading/#mount-strategies). It only mounts on fine-pointer devices, leaving native CSS scroll-snap to handle touch devices. Apply it to the same element as `CarouselWrapper`.
