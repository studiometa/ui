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
- `CarouselDots` — optional pagination dots, one button per slide
- `CarouselThumbnails` — optional thumbnail picker, one image button per slide
- `CarouselCount` — optional "3 / 5" readout
- `CarouselProgress` — optional progress bar, following the scroll offset

Every control resolves the carousel through the shared `CarouselContext`, so none of them names a selector, imports the `Carousel` class or has to be ordered against the others. A control mounted before its carousel waits for it; a control mounted outside a carousel does nothing at all.

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

Every one is a development-only warning on the [toolkit diagnostic channel](https://js-toolkit-v4.studiometa.dev/).

| Code                                | Meaning                                                                |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `carousel.unnamed`                  | The root has neither an `aria-label` nor an `aria-labelledby`.         |
| `carousel.unnamed-btn`              | A `CarouselBtn` has no text, no `aria-label` and no `aria-labelledby`. |
| `carousel-count.no-refs`            | A `CarouselCount` has neither a `current` nor a `total` ref.           |
| `carousel-progress.no-ref`          | A `CarouselProgress` has no `progress` ref.                            |
| `carousel-play.not-first-focusable` | A `CarouselPlay` is not the first focusable element in the carousel.   |

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

## CarouselDots

Pagination dots: one `<button>` per slide, marking the one showing. One component over the whole list rather than one per dot, so adding a slide means adding a dot and nothing has to be renumbered.

```html
<div data-component="CarouselDots">
  <button type="button" data-ref="dots[]"></button>
  <button type="button" data-ref="dots[]"></button>
  <button type="button" data-ref="dots[]"></button>
</div>
```

### `dots[]`

- Type: `HTMLButtonElement[]`

One button per slide, in slide order. The dot at position _n_ goes to slide _n_. Dots added after mount are picked up with no `$update()`.

### What it writes

| Attribute             | On                                | Meaning                                                              |
| --------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `aria-current="true"` | the dot for the current slide     | The marker, and the CSS hook: style `[aria-current="true"]`.         |
| `aria-label`          | every dot with no name of its own | The carousel's [`slide-label`](#slide-label), so `1 of 5`, `2 of 5`… |

**No tab semantics.** No `role="tablist"`, no `role="tab"`, no `aria-selected`. The APG prescribes them for a "tabbed carousel" and every piece of user testing published since contradicts it — the objection has been open on the APG repository, unanswered, for eight years. Tab semantics also promise arrow-key navigation and a roving `tabindex`, which this widget does not implement; a set of dots that announces arrow keys and ignores them is worse than one that never claimed them.

**Never `disabled`.** The dot for the current slide keeps its place in the tab order. `disabled` would take it out of the accessibility tree, so the set would silently lose one every time the carousel moved. Same reason [`CarouselBtn`](#carouselbtn) uses `aria-disabled` for a numeric action.

**Naming.** A dot the author named — text, `aria-label`, `aria-labelledby`, or an `<img alt>` inside it — keeps its name. Every other one gets the positional fallback, including the common case of a dot whose only content is an `aria-hidden` bullet: its `textContent` is not empty but its accessible name is, so it is named anyway.

It composes [`withTransition`](/reference/items/Transition/), so the [transition options](/reference/items/Transition/js-api) apply to the dots: the outgoing dot leaves while the incoming one enters.

<!-- prettier-ignore-start -->
```html {2,3}
<div data-component="CarouselDots"
  data-option-enter-to="scale-150"
  data-option-enter-keep>
  …
</div>
```
<!-- prettier-ignore-end -->

## CarouselThumbnails

A thumbnail picker: one image button per slide, marking the one open. The control the interaction research asks for — thumbnails are the measured winner at 55% of visitors, more than the arrows and the swipe gesture together, and the fix for the finding that 50% of desktop users could not find a product's additional images when only indicators were shown.

```html
<div data-component="CarouselThumbnails">
  <button type="button" data-ref="thumbs[]">
    <img src="/product-front.jpg" alt="Red dress, front view" />
  </button>
  <button type="button" data-ref="thumbs[]">
    <img src="/product-back.jpg" alt="Red dress, back view" />
  </button>
</div>
```

### `thumbs[]`

- Type: `HTMLButtonElement[]`

One button per slide, in slide order. The thumbnail at position _n_ opens slide _n_.

### What it writes

| Attribute             | On                                      | Meaning                                       |
| --------------------- | --------------------------------------- | --------------------------------------------- |
| `aria-current="true"` | the thumbnail for the open slide        | The marker, and the CSS hook.                 |
| `aria-label`          | every thumbnail with no name of its own | The carousel's [`slide-label`](#slide-label). |

The semantics are [`CarouselDots`](#carouseldots)' semantics, for the same reasons: plain buttons, no tab roles, never `disabled`.

**Naming is the part to get right.** `<button><img alt="Red dress, front"></button>` already has an accessible name — the image's `alt` — and it is a far better name than a position, so it is left alone. The positional fallback is written only when the button would otherwise be nameless, which is the `alt=""` decorative-image case an author reaches for without realising the button goes with it.

::: tip
Write a real `alt` on every thumbnail image. `3 of 5` says how many slides there are; `Red dress, back view` says which one this button opens, which is the reason the control exists.
:::

## CarouselCount

The `3 / 5` readout.

```html
<p data-component="CarouselCount">
  <span data-ref="current"></span>
  /
  <span data-ref="total"></span>
</p>
```

### `current`

- Type: `HTMLElement`
- Optional

Receives the **one-based** position of the current slide. `index` is zero-based everywhere else in the API; a person counting slides starts at one.

### `total`

- Type: `HTMLElement`
- Optional

Receives the live slide count. Appending a slide rewrites it.

Both refs are optional and both are guarded, so a count that shows only the total is valid markup. A `CarouselCount` with neither reports `carousel-count.no-refs` and does nothing.

**No `aria-live`.** The count repeats something the user has just done — pressed a button, or scrolled — and announcing "3 of 5" over the slide a screen reader is already reading is noise. The slides carry their own names, which is where the position is announced from.

## CarouselProgress

A progress bar following the carousel's scroll offset.

```html
<div data-component="CarouselProgress" aria-hidden="true" style="overflow: hidden">
  <span data-ref="progress"></span>
</div>
```

### `progress`

- Type: `HTMLElement`

The bar. It is translated from fully out of view at `0` to fully in place at `1`, so put it in a container with `overflow: hidden` and it is revealed rather than stretched — a bar with a gradient, a border radius or an icon on its end keeps its proportions. A `CarouselProgress` without this ref reports `carousel-progress.no-ref`.

**Continuous, not index-derived.** It reads the carousel's scroll progress, so it moves with the finger during a drag instead of teleporting one step per slide. Under a peek or a multi-slide layout, `index / (total - 1)` is simply a different quantity from how far the track has scrolled; this is the second one, and it is the value [`animation-timeline: scroll()`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/scroll) replaces natively.

It measures nothing: the offset is a percentage of the bar's own width, so there is no layout read per frame, and the vertical axis is the same expression with the components swapped. The axis is read per update, so a carousel that turns vertical at a breakpoint unwinds the horizontal transform on its own.

::: tip
There is a version of this with no JavaScript at all. `Carousel` already sets [`--carousel-progress`](#carousel-progress) on its root and custom properties inherit, so any descendant can write `transform: scaleX(var(--carousel-progress))`. Use `CarouselProgress` when you want the bar driven for you on either axis; use the custom property when you want to drive something else with it.
:::

The bar is decorative — it repeats the scroll position, which is not information a screen reader user is missing. Put `aria-hidden="true"` on the element that holds it. The component does not write it, because that element may hold content of yours that is not decorative.

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

While a gesture is running, the track's `scroll-snap-type` is set to `none` — a snapping track cannot be moved to a position that is not a snap point — and restored once the settle scroll has finished.

### How a release settles

The drag service reports the position the throw was heading for, so the track never needs a sensitivity multiplier to guess it. The carousel goes to the snap point closest to that projected position, however many slides away it is.

Every release settles the same way. A slow one projects barely past the pointer and lands on the slide the gesture is sitting over; a hard flick projects far ahead and crosses as many slides as its momentum carries it. There is no per-gesture limit — a long carousel is meant to be crossed with one throw.

## CarouselPlay

The rotation control of an auto-rotating carousel: a `<button>` that advances the carousel on a timer and lets the user stop it. **A carousel never rotates unless this element is in the markup.**

It extends [`TimerProgress`](/reference/items/Timer/js-api), so the countdown, its `delay`, `repeat` and `autostart` options, its `pause()` / `resume()` methods, its six `timer-*` events and its per-frame `timer-progress` ratio are the `Timer` primitives, unchanged. Nothing about the timing is re-implemented here.

It is registered by `Carousel`, so registering the carousel is enough:

```js twoslash [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { Carousel } from '@studiometa/ui';

registerComponent(Carousel);
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
