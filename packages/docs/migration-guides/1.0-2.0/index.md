# v1.x → v2.x

v2 runs on [`@studiometa/js-toolkit` v4](https://js-toolkit-v4.studiometa.dev/). It removes seven component families, renames three components, rewrites `Tabs`, redesigns `Cursor` around published CSS hooks, gives `Carousel` an accessibility contract, and changes every event payload. There is no compatibility layer.

[[toc]]

## Steps

1. Update the dependencies.

   ```diff
      "dependencies": {
   -    "@studiometa/js-toolkit": "^3.0.0",
   -    "@studiometa/ui": "^1.0.0"
   +    "@studiometa/js-toolkit": "^4.0.0",
   +    "@studiometa/ui": "^2.0.0"
      }
   ```

2. Read [the js-toolkit v3 → v4 guide](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html). It is the larger half of this migration. [Summary below](#js-toolkit-v4-changes-that-reach-your-code).
3. Replace the [removed components](#removed-components).
4. Rename the [renamed components](#renamed-components).
5. Replace `LargeText` and `CircularMarquee` with the [merged `Marquee`](#merged-components).
6. Rewrite the markup of the [rewritten components](#rewritten-components).
7. Rewrite every `event.detail[0]` as a [named read](#event-payloads).
8. Rename the [renamed events](#renamed-events).
9. Check the [removed options, APIs, subpaths and types](#removed-options-and-apis).

## Registering components

Registration itself is unchanged.

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Disclosure, DisclosureGroup, Fetch } from '@studiometa/ui';

registerComponents(Disclosure, DisclosureGroup, Fetch);
```

Two changes around it:

- `createApp()` is removed. Register the components a page uses.
- `registerComponent()` takes one argument. To register under another name, subclass it:

  ```diff
  - registerComponent(AnchorScrollTo, 'a[href^="#"]');
  ```

  ```js
  class SmoothAnchor extends ScrollTo {
    static config = { name: 'SmoothAnchor' };
  }

  registerComponent(SmoothAnchor);
  ```

## Removed components

| v1.x                                                     | v2.x                                                |
| -------------------------------------------------------- | --------------------------------------------------- |
| `Accordion`                                              | `DisclosureGroup`                                   |
| `AccordionItem`                                          | `Disclosure`                                        |
| `Frame` family, `AbstractFrameTrigger`                   | `Fetch`                                             |
| `Modal`, `ModalWithTransition`, `Panel`                  | `Dialog`                                            |
| `ScrollAnimation` family, `animationScrollWithEase`      | [`@studiometa/ui-motion`](/reference/items/Motion/) |
| `Slider` family, `AbstractSliderChild`                   | `Carousel` family                                   |
| `withScrollAnimationDebug`                               | removed                                             |
| `ImageGrid`, `Reinsurance`, `StyledModal`, `StyledPanel` | removed                                             |

### `Accordion` → `Disclosure` + `DisclosureGroup`

```html
<!-- v1 -->
<div data-component="Accordion" data-option-autoclose>
  <div data-component="AccordionItem">
    <button data-ref="btn">Title</button>
    <div data-ref="container"><div data-ref="content">Content</div></div>
  </div>
</div>

<!-- v2 -->
<div data-component="DisclosureGroup" data-option-no-multiple>
  <div data-component="Disclosure">
    <button data-ref="trigger" id="item-trigger">Title</button>
    <div data-ref="panel" id="item-panel">Content</div>
  </div>
</div>
```

| v1.x                    | v2.x                                              |
| ----------------------- | ------------------------------------------------- |
| `btn` ref               | `trigger` ref                                     |
| `content` ref           | `panel` ref                                       |
| `container` ref         | removed — nest a `Transition` or `ViewTransition` |
| `data-option-is-open`   | `data-option-open`                                |
| `data-option-styles`    | removed                                           |
| `data-option-autoclose` | `data-option-no-multiple`                         |

`autoclose` was off by default; `multiple` is **on** by default. The two are inverted, not renamed.

The trigger and panel both need an `id`: `Disclosure` wires `aria-controls` and `aria-labelledby` between them. `Disclosure.twig` writes them.

`DisclosureGroup` adds a `collapsible` option, on by default, which decides whether the last open disclosure can close.

### `Frame` → `Fetch`

**`Fetch` is declared on the anchor or the form itself**, not on a wrapper. It acts on `this.$el` and never looks at descendants, so each link or form carries its own `data-component="Fetch"`.

```html
<!-- v1 -->
<div data-component="Frame" data-option-history>
  <a data-component="FrameAnchor" href="/page-2">Page 2</a>
  <div data-component="FrameTarget" id="content">…</div>
  <div data-component="FrameLoader">Loading…</div>
</div>

<!-- v2 -->
<a data-component="Fetch" data-option-history href="/page-2">Page 2</a>
<div id="content">…</div>
```

- `FrameTarget` becomes a plain `id`. `Fetch` replaces every `[id]` element the response also contains. The elements do not have to be siblings.
- `FrameLoader` has no equivalent. Listen for the `fetch-*` events.
- The `frame-*` events become the `fetch-*` set. See [the API page](/reference/items/Fetch/js-api).
- To keep one declaration for a region, mount `Fetch` on any element with the [`src` option](/reference/items/Fetch/js-api#src) and call `fetch()` yourself.

### `Modal` and `Panel` → `Dialog`

```diff
- <div data-component="Modal">
-   <button data-ref="open[]">Open</button>
-   <div aria-hidden="true" data-ref="modal">
-     <div data-ref="overlay"></div>
-     <div data-ref="container">
-       <button data-ref="close[]">Close</button>
-       <div data-ref="content">…</div>
-     </div>
-   </div>
- </div>
+ <button type="button" data-component="Action" data-on:click="Dialog(#my-dialog)->target.open()">Open</button>
+ <dialog id="my-dialog" data-component="Dialog">
+   <button type="button" data-component="Action" data-on:click="Dialog(#my-dialog)->target.close()">Close</button>
+   …
+ </dialog>
```

- The root element must be a `<dialog>`.
- `open()`, `close()` and `toggle()` are asynchronous and resolve once child transitions have run.
- The `move`, `autofocus` and `styles` options are removed. Nest a [`Transition`](/reference/items/Transition/) to animate; the native element handles focus.
- `Panel`'s `position` option is removed. There is no `Drawer`: see [Building a drawer](/reference/items/Dialog/#building-a-drawer).

### `ScrollAnimation` → `@studiometa/ui-motion`

```diff
   "dependencies": {
+    "@studiometa/ui-motion": "^2.0.0"
   }
```

```html
<!-- v1: the animated element is the target ref -->
<div
  data-component="ScrollAnimation"
  data-option-from='{ "opacity": 0, "y": 100 }'
  data-option-to='{ "opacity": 1, "y": 0 }'>
  <div data-ref="target">Content to animate</div>
</div>

<!-- v2: Motion animates its own element, the timeline is its ancestor -->
<div data-component="MotionScrollTimeline">
  <div
    data-component="Motion"
    data-option-initial='{ "opacity": 0, "y": 100 }'
    data-option-animate='{ "opacity": 1, "y": 0 }'>
    Content to animate
  </div>
</div>
```

- `from` and `to` become `initial` and `animate`.
- `playRange`, `easing` and `dampFactor` have no equivalent. Use `Motion`'s `transition` option and `MotionScrollTimeline`'s `offset`.

### `Slider` → `Carousel`

`Carousel` replaces the whole family. It moves the slides with native scrolling and `scroll-snap` instead of a transform. **[The CSS moves with it](#the-css-change).** Read that section before anything else: it is the one change no consumer can skip.

| v1.x                                             | v2.x                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| `Slider`                                         | `Carousel`                                                           |
| `wrapper` ref                                    | `CarouselWrapper` — a component, not a ref, and the scroll container |
| `SliderItem`                                     | `CarouselItem`                                                       |
| `SliderDrag`                                     | `CarouselDrag`, on the `CarouselWrapper` element                     |
| `SliderBtn`                                      | `CarouselBtn`                                                        |
| `SliderCount`                                    | `CarouselCount`                                                      |
| `SliderDots`                                     | `CarouselDots`                                                       |
| `SliderProgress`                                 | `CarouselProgress`                                                   |
| `AbstractSliderChild`                            | `AbstractCarouselChild`                                              |
| `SliderContext`                                  | `CarouselContext`                                                    |
| `SliderState`, `SliderApi`                       | `CarouselState`, `CarouselApi`                                       |
| `dots[]`, `current`, `total` and `progress` refs | unchanged names, on the control that owns each                       |

`Slider` declared only `SliderItem` and `SliderDrag`, so every control had to be registered by hand. `Carousel` declares its whole family: `registerComponent(Carousel)` is enough.

#### The CSS change

`Slider` moved the slides with `transform`, so nothing scrolled: the **root** clipped and the wrapper had no overflow of its own. `Carousel` scrolls, so the **wrapper** is the scroll container and needs `overflow` and `scroll-snap` of its own. Every documented v1 example has to be restyled.

```diff
- <div data-component="Slider" data-option-fit-bounds class="overflow-hidden">
-   <div data-component="SliderDrag" data-ref="wrapper" tabindex="0" class="flex gap-4">
-     <div data-component="SliderItem" class="shrink-0">…</div>
-   </div>
- </div>
+ <div data-component="Carousel" aria-label="Featured products">
+   <div data-component="CarouselWrapper CarouselDrag" class="flex gap-4 overflow-x-auto snap-x snap-mandatory">
+     <div data-component="CarouselItem" class="shrink-0 snap-center">…</div>
+   </div>
+ </div>
```

```css
/* v1 — the root clips, the track never scrolls */
[data-component~='Slider'] {
  overflow: hidden;
}
[data-ref='wrapper'] {
  display: flex;
}
[data-component~='SliderItem'] {
  flex: none;
}
```

```css
/* v2 — the track scrolls, the root clips nothing */
[data-component~='CarouselWrapper'] {
  display: flex;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* optional */
}
[data-component~='CarouselItem'] {
  flex: none;
  scroll-snap-align: center;
}
```

- Take `overflow: hidden` off the root. On the root it clips the scrollbar and the focus ring, and it cannot clip a scroll it no longer owns.
- Use `overflow-x: auto`, never `overflow-x: hidden`: `hidden` leaves the element scrollable programmatically but takes away every user gesture, keyboard and touch alike.
- Padding on the track is mirrored into its `scroll-padding` for you. Do not add `scroll-padding` unless you want to override it.
- `data-option-axis="y"` needs `overflow-y: auto` and `scroll-snap-type: y mandatory` instead.

#### Options

| v1.x               | v2.x                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `mode="center"`    | `scroll-snap-align: center` on the slide                           |
| `mode="left"`      | `scroll-snap-align: start` on the slide                            |
| `mode="right"`     | `scroll-snap-align: end` on the slide                              |
| `contain`          | removed — a scroll container cannot scroll past its own range      |
| `fit-bounds`       | `scroll-snap-type: x mandatory` on the track                       |
| no `fit-bounds`    | `scroll-snap-type: none` on the track                              |
| `sensitivity`      | no equivalent                                                      |
| `drop-sensitivity` | no equivalent                                                      |
| —                  | `axis`, `slide-label`, and `boundary` / `reverse` from `Indexable` |

- `mode` becomes CSS. `goTo()` reads each slide's own `scroll-snap-align` and scrolls to the offset that alignment names, so a programmatic move lands exactly where a native snap would. One keyword applies to both axes; with two, the block axis comes first (`scroll-snap-align: <block> <inline>`), so a horizontal carousel reads the second. A slide set to `none` is centred.
- `sensitivity` scaled the pointer travel. `drop-sensitivity` multiplied the projected throw. The drag service projects the settle per device now, so neither has a value to scale.
- `scroll-snap-type: none` frees every release, mouse drag included: `CarouselDrag` reads the track's declaration and coasts to the projection instead of snapping. `CarouselDrag` stays on the element.

#### Events

| v1.x                                        | v2.x                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| `goto`, on every `goTo()` call              | no equivalent                                            |
| `index`, on every `goTo()` and every resize | `index`, on a change of index only                       |
| `SliderDrag` `start`, `drag`, `drop`, …     | no equivalent — `CarouselDrag` emits nothing             |
| —                                           | `progress`, plus a `--carousel-progress` custom property |

v1 re-ran `goTo()` from `refresh()`, and `refresh()` ran on every resize, so `index` fired with an unchanged value. A listener written to filter that out can be simplified.

#### API

| v1.x                   | v2.x                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `goTo(index)`          | `goTo(index)` — asynchronous, also takes `'next'`, `'previous'`, `'first'`, `'last'`, `'random'` |
| `goNext()`, `goPrev()` | unchanged names, asynchronous                                                                    |
| `refresh()`            | `resized()`                                                                                      |
| `indexMax`             | `maxIndex`                                                                                       |
| `currentSliderItem`    | `items.items[currentIndex]`                                                                      |
| `states`, `origins`    | `positions`, the centred scroll offset of every slide                                            |

#### Behaviour with no equivalent

- **Arrow keys.** `Slider` bound <kbd>←</kbd> and <kbd>→</kbd> on the `wrapper` ref. `Carousel` binds nothing to them on purpose — a snap track ignores them, and a text field inside a slide needs them. Ship `CarouselBtn` controls.
- **`tabindex="0"` on the track.** Yours to write in v1. `CarouselWrapper` writes it, and only when nothing inside the track is focusable. Remove yours.
- **`.is-active` on the current slide.** `CarouselItem` sets a `--carousel-item-active` custom property, `1` on the current slide and `0` on the others. Select on the property, not on a class.
- **Mouse drag on a touch screen.** `SliderDrag` mounted everywhere. `CarouselDrag` mounts on `(pointer: fine)` only; a touch screen scrolls natively.
- **Looping.** No `Slider` option looped, and `Carousel`'s `boundary="loop"` wraps the index while the scroller clamps. Leave it at `clamp`.

#### Migration steps

1. Rename every `data-component` token, every import and every subpath.
2. Move the overflow: root to wrapper, plus `scroll-snap-type` and `scroll-snap-align`. See [the CSS change](#the-css-change).
3. Add `data-component="CarouselWrapper"` to the element that was `data-ref="wrapper"`, and drop the ref.
4. Delete `data-option-mode`, `data-option-contain`, `data-option-fit-bounds`, `data-option-sensitivity` and `data-option-drop-sensitivity`.
5. Replace `data-option-prev` / `data-option-next` on each button with `data-option-action="prev"` / `data-option-action="next"`.
6. Give the root an `aria-label` and every button a name. See [the `Carousel` accessibility contract](#carousel).
7. Replace `goto` listeners with `index`.
8. Replace `.is-active` selectors with `--carousel-item-active`.
9. Delete `registerComponents(Slider, SliderBtn, …)` down to `registerComponent(Carousel)`.

### Removed templates

```diff
- {% include '@ui/ImageGrid/ImageGrid.twig' with { … } %}
- {% include '@ui/Reinsurance/Reinsurance.twig' with { … } %}
- {% include '@ui/Modal/StyledModal.twig' with { … } %}
- {% include '@ui/Panel/StyledPanel.twig' with { … } %}
```

Copy the template into your project if you still need it. Every Twig template other than `Tabs.twig` is unchanged, parameters included.

## New components

| v1.x                            | v2.x                 |
| ------------------------------- | -------------------- |
| a hand-rolled carousel autoplay | `CarouselPlay`       |
| `SliderDots`                    | `CarouselDots`       |
| `SliderCount`                   | `CarouselCount`      |
| `SliderProgress`                | `CarouselProgress`   |
| —                               | `CarouselThumbnails` |

`Carousel` declares all five, so `registerComponent(Carousel)` is enough.

`CarouselPlay` is a `<button>` inside the carousel, off unless the element is there. It extends `TimerProgress`, so `delay`, `repeat`, `autostart` and the `timer-*` events are the ones you already know.

Put it first inside the carousel: it must be the first focusable element. Turning the automatic start off is `data-option-no-autostart`, never `data-option-autostart="false"`.

### `SliderDots` → `CarouselDots`

```diff
- <div data-component="SliderDots" data-option-enter-to="is-active" data-option-enter-keep>
+ <div data-component="CarouselDots" data-option-enter-to="is-active" data-option-enter-keep>
    <button type="button" data-ref="dots[]"></button>
  </div>
```

| v1.x               | v2.x                                                       |
| ------------------ | ---------------------------------------------------------- |
| `dots[]` ref       | `dots[]` ref — unchanged                                   |
| transition options | unchanged                                                  |
| —                  | `aria-current="true"` on the current dot                   |
| —                  | `aria-label` on every dot with no name, from `slide-label` |

Style the active dot with `[aria-current="true"]`; the transition classes still work.

### `SliderCount` → `CarouselCount`

```diff
- <p data-component="SliderCount">
+ <p data-component="CarouselCount">
    <span data-ref="current"></span> / <span data-ref="total"></span>
  </p>
```

| v1.x                                | v2.x                                        |
| ----------------------------------- | ------------------------------------------- |
| `current` ref, required — it throws | `current` ref, optional                     |
| `total` ref, optional               | `total` ref, optional                       |
| —                                   | `carousel-count.no-refs` warning when empty |

### `SliderProgress` → `CarouselProgress`

```diff
- <div data-component="SliderProgress">
+ <div data-component="CarouselProgress" aria-hidden="true">
    <span data-ref="progress"></span>
  </div>
```

| v1.x                                         | v2.x                                          |
| -------------------------------------------- | --------------------------------------------- |
| `progress` ref                               | `progress` ref — unchanged                    |
| index-derived, one step per slide            | continuous, following the scroll offset       |
| `translate3d(<px>, 0, 0)` from `clientWidth` | `translate3d(<%>, <%>, 0)`, axis-aware        |
| —                                            | `carousel-progress.no-ref` warning when empty |

Give the container `overflow: hidden` and the bar `width: 100%`. Nothing else changes.

### `CarouselThumbnails`

New. One image button per slide:

```html
<div data-component="CarouselThumbnails">
  <button type="button" data-ref="thumbs[]">
    <img src="/front.jpg" alt="Red dress, front view" />
  </button>
</div>
```

The image's `alt` names the button. A thumbnail with no name gets `slide-label` instead. The open one carries `aria-current="true"`.

## Renamed components

The API of each is unchanged.

| v1.x               | v2.x                    |
| ------------------ | ----------------------- |
| `LazyInclude`      | `Defer`                 |
| `AnchorScrollTo`   | `ScrollTo`              |
| `PrefetchWhenOver` | `PrefetchOnInteraction` |

Rename the import, the subpath and the `data-component` value:

```diff
- import { LazyInclude } from '@studiometa/ui/LazyInclude';
+ import { Defer } from '@studiometa/ui/Defer';
```

```diff
- <div data-component="LazyInclude" data-option-src="/fragment.html">
+ <div data-component="Defer" data-option-src="/fragment.html">
```

Notes:

- `Defer`'s events take the family prefix: `content` → `defer-content`, `error` → `defer-error`, `always` → `defer-always`.
- `AnchorNavLink` extends `ScrollTo` and follows the rename with no change of its own.
- `PrefetchOnInteraction` prefetches on the first of `pointerenter`, `pointerdown` or `focusin`. v1 bound `mouseenter` only, which never fired for touch or keyboard.
- The `/reference/items/LazyInclude/` and `/reference/items/AnchorScrollTo/` URLs now return 404.

## Merged components

| v1.x                                       | v2.x                               |
| ------------------------------------------ | ---------------------------------- |
| `LargeText`                                | `Marquee`                          |
| `CircularMarquee`                          | `Marquee`                          |
| `@ui/LargeText/LargeText.twig`             | `@ui/Marquee/Marquee.twig`         |
| `@ui/CircularMarquee/CircularMarquee.twig` | `@ui/Marquee/CircularMarquee.twig` |
| `LargeTextProps`, `CircularMarqueeProps`   | `MarqueeProps`                     |

### `LargeText` and `CircularMarquee` → `Marquee`

The two were one component. Both accumulated the scroll delta, damped it at a hardcoded `0.25` and wrote a transform; only the transform property differed, and "circular" was an SVG `textPath` with no JavaScript of its own. `Marquee` computes the travel once and publishes it as `--marquee-progress`, `--marquee-offset` and `--marquee-velocity`; the stylesheet decides whether the travel is a translation, a rotation or a skew. Both templates ship that CSS, so they move as soon as the class is registered.

`CircularMarquee.twig` survives, under the `Marquee` directory. There is no `CircularMarquee` class.

Rename the import, the subpath, the template path and the `data-component` value:

```diff
- import { LargeText } from '@studiometa/ui/LargeText';
- import { CircularMarquee } from '@studiometa/ui/CircularMarquee';
+ import { Marquee } from '@studiometa/ui/Marquee';
```

```diff
- <div data-component="LargeText">
-   <span data-ref="target">…</span>
- </div>
+ <div data-component="Marquee">
+   <span style="transform: translateX(calc(var(--marquee-progress, 0) * -100%))">…</span>
+ </div>
```

The options changed units, so the v1 numbers do not carry over.

| v1.x                              | v2.x                                                                    |
| --------------------------------- | ----------------------------------------------------------------------- |
| `sensitivity` (pixels per frame)  | `speed` (loops per second) and `sensitivity` (loops per pixel scrolled) |
| `skew`, `skewSensitivity`         | CSS reading `--marquee-velocity`                                        |
| `target` ref                      | removed                                                                 |
| `width`, `measure()`, `resized()` | removed                                                                 |
| `x`, `transform`, `rotate`        | `offset`, `dampedOffset`, `velocity`                                    |

Steps:

1. Split the old `sensitivity` in two. v1 multiplied `Math.abs(deltaY) + 1` by it, so one number set both the idle speed and the scroll boost. `speed` is now the idle travel in loops per second (default `0.1`) and `sensitivity` the boost in loops per pixel scrolled (default `0.001`). A negative `sensitivity` still reverses the whole marquee.
2. Move `skew` and `skewSensitivity` into the track's `transform`. The component publishes the damped rate; CSS reads and clamps it.

   ```css
   transform: translateX(calc(var(--marquee-progress) * -100%))
     skewX(clamp(-15deg, calc(var(--marquee-velocity) * 3deg), 15deg));
   ```

3. Drop the `target` ref. `Marquee` reads no geometry: `-100%` is the content width by definition, so there is nothing to measure and nothing to re-measure on a resize.
4. Set `damping` if `0.25` was not the right smoothing. It was hardcoded in v1 and is an option now.

Two behaviour changes worth knowing:

- **The idle travel stops under `prefers-reduced-motion: reduce`, the scroll-driven travel does not.** Neither v1 component honoured the setting.
- **A scroll no longer runs for ever.** v1 kept the last scroll delta after the page stopped, so the marquee stayed at the speed of a scroll that had finished. Each frame now consumes the distance actually scrolled since the previous one.

The `/reference/items/LargeText/` and `/reference/items/CircularMarquee/` URLs redirect to `/reference/items/Marquee/`.

## Rewritten components

### `Tabs`

Same job, new contract: the [WAI-ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) in full.

```html
<!-- v1 -->
<div
  data-component="Tabs"
  data-option-styles='{ "btn": { "open": { "borderBottomColor": "#fff" } } }'>
  <button data-ref="btn[]">Tab 1</button>
  <button data-ref="btn[]">Tab 2</button>
  <div data-ref="content[]" aria-hidden="false">Panel 1</div>
  <div data-ref="content[]" aria-hidden="true">Panel 2</div>
</div>

<!-- v2 -->
<div data-component="Tabs">
  <div data-ref="list" role="tablist" aria-label="Sections">
    <button type="button" role="tab" data-ref="btn[]" aria-selected="true" tabindex="0">
      Tab 1
    </button>
    <button type="button" role="tab" data-ref="btn[]" aria-selected="false" tabindex="-1">
      Tab 2
    </button>
  </div>
  <div role="tabpanel" data-ref="content[]" tabindex="0">Panel 1</div>
  <div role="tabpanel" data-ref="content[]" tabindex="0" hidden>Panel 2</div>
</div>
```

| v1.x                                     | v2.x                                                                |
| ---------------------------------------- | ------------------------------------------------------------------- |
| —                                        | `list` ref, required, carries `role="tablist"` and its name         |
| `btn[]` ref                              | `btn[]` ref — unchanged, must be a native `<button>`                |
| `content[]` ref                          | `content[]` ref — unchanged                                         |
| `data-option-styles`                     | removed — CSS on `[aria-selected="true"]`, or a nested `Transition` |
| `aria-hidden` on the closed panel        | the `hidden` property                                               |
| `enableItem(item)` / `disableItem(item)` | `goTo(index)`, `goNext()`, `goPrev()`, `focusTab(index)`            |
| `items`                                  | `currentIndex`, `length`, `orientation`                             |
| the first tab, always                    | the first `btn` carrying `aria-selected="true"`                     |
| —                                        | `activation` option, `automatic` or `manual`                        |
| —                                        | arrow, <kbd>Home</kbd> and <kbd>End</kbd> keys, roving `tabindex`   |

`Tabs.twig` follows: `label` and `list_attr` are new parameters, `id` is optional, `items[].selected` marks the open tab, and the `title_wrapper` block now renders inside the `role="tablist"` element.

### `Carousel`

The API is unchanged. The accessibility contract is new, and two things it needs are yours to write.

```diff
- <div data-component="Carousel">
+ <div data-component="Carousel" aria-label="Featured products">
    <div data-component="CarouselWrapper">…</div>
-   <button data-component="CarouselBtn" data-option-action="prev"></button>
+   <button type="button" data-component="CarouselBtn" data-option-action="prev" aria-label="Previous slide"></button>
  </div>
```

| v1.x                             | v2.x                                                                |
| -------------------------------- | ------------------------------------------------------------------- |
| —                                | `aria-label` or `aria-labelledby` on the root, required             |
| —                                | a name on every `CarouselBtn`, required                             |
| —                                | `slide-label` option, `{index} of {total}` by default               |
| —                                | `role="group"` written on the root and on every `CarouselItem`      |
| —                                | `inert` on every slide that does not intersect the track            |
| —                                | `tabindex="0"` on the track when no slide holds a focusable element |
| —                                | `scroll-padding` on the track, mirroring its own padding            |
| `disabled` on the current picker | `aria-current="true"` — a numeric `CarouselBtn` stays focusable     |

Steps:

1. Add an `aria-label` or an `aria-labelledby` to every `Carousel` root. Missing ones log `carousel.unnamed`.
2. Add a name to every icon-only or empty `CarouselBtn`. Missing ones log `carousel.unnamed-btn`.
3. Replace any CSS selecting `[data-component~="CarouselBtn"]:disabled` for a numeric action with `[aria-current="true"]`, the same selector the dots and thumbnails use.
4. Translate the slide name with `data-option-slide-label` on a non-English page.
5. Remove any `role`, `aria-label` or `aria-roledescription` you were writing by hand only if you want the defaults; an attribute already in the markup is never overwritten.

`aria-roledescription` is not written. `Slider` emitted `carousel` and `slide` untranslated; nothing translates the attribute. Write it yourself if you want it.

### `Cursor`

Eight options become two. v1 hardcoded one visual — a dot that translates and scales, over two fixed states, with two fixed scale factors and three damp factors. v2 publishes the position and the state on the root element and leaves the visual to CSS.

```diff
- <div
-   data-component="Cursor"
-   data-option-grow-selectors="a, a *, button, button *"
-   data-option-shrink-selectors="[data-cursor-shrink], [data-cursor-shrink] *"
-   data-option-grow-to="2"
-   data-option-shrink-to="0.5"></div>
+ <div
+   data-component="Cursor"
+   data-option-states='{"a, button": "grow", "[data-cursor-shrink]": "shrink"}'></div>
```

```css
[data-component='Cursor'][data-cursor-state='grow'] {
  scale: 2;
}
[data-component='Cursor'][data-cursor-state='shrink'] {
  scale: 0.5;
}
```

| v1.x                                                             | v2.x                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| `data-option-grow-selectors`                                     | an entry of `data-option-states`                               |
| `data-option-shrink-selectors`                                   | an entry of `data-option-states`                               |
| `data-option-scale`                                              | removed — the element's own CSS                                |
| `data-option-grow-to`                                            | `[data-cursor-state='grow'] { scale: … }`                      |
| `data-option-shrink-to`                                          | `[data-cursor-state='shrink'] { scale: … }`                    |
| `data-option-translate-damp-factor`                              | `data-option-damping`                                          |
| `data-option-grow-damp-factor`, `data-option-shrink-damp-factor` | removed — `transition: scale …`                                |
| the forced shrink while the pointer is down                      | `data-cursor-down`, published apart from the state             |
| `transform: matrix(…)` on the element                            | `translate` on the element, plus `--cursor-x` and `--cursor-y` |
| `motion` with an `x`, `y` and `scale` channel                    | `motion` with an `x` and `y` channel                           |

Steps:

1. Fold the two selector options into one `data-option-states` map. It is JSON, and the value of an entry is the state name you will style. The default is empty: a `Cursor` with no map publishes no state.
2. Drop the `a *` and `button *` companions. Selectors are matched with `closest()`, so `"a"` already means "over a link, or anything inside it".
3. Move `scale`, `grow-to` and `shrink-to` into CSS, as `scale` on `[data-cursor-state='<name>']`.
4. Move `grow-damp-factor` and `shrink-damp-factor` into a `transition` on the same rule. `translate-damp-factor` becomes `data-option-damping`.
5. Replace any CSS or JS reading the element's `transform` with `translate`, `--cursor-x` or `--cursor-y`. **Write your scale into `scale`, not into `transform`**: the individual transform properties compose with `translate` outermost, so a `transform: scale(2)` would multiply the position the component just wrote.
6. Style the press with `[data-cursor-down]`. It is not a state, so a press over a growing element keeps its `grow` and the cascade decides what that looks like.

`Cursor.twig` gains a `states` and a `damping` parameter and ships the default stylesheet, wrapped in `:where()` so any rule of yours wins. Its Tailwind classes are gone.

### `CarouselDrag`

The throw settles the same way as v1: the slide nearest the projected resting point, however many slides that crosses. Nothing to migrate.

What changed is how the projection is measured. v1 multiplied the last event's delta by `-2.5`, a per-device quantity, so the same flick threw differently on a 1000 Hz mouse and a 125 Hz trackpad. The drag service reports its own settle position now, so the throw is the same gesture on every device.

## Event payloads

In v1 every `detail` was an array of the positional arguments. In v2 it is the payload object, or `null` when there is none.

```diff
  element.addEventListener('prefetched', (event) => {
-   console.log(event.detail[0]);
+   console.log(event.detail.url);
  });
```

This includes components whose payload was already an object: `Fetch` and `Draggable` were `[{ … }]` in v1 and are `{ … }` in v2.

| Component         | Event                              | v1.x `detail`            | v2.x `detail`              |
| ----------------- | ---------------------------------- | ------------------------ | -------------------------- |
| `Carousel`        | `progress`                         | `[progress]`             | `{ progress }`             |
| `ClickOutside`    | `click-outside`                    | `{ event }`              | `{ event }` — unchanged    |
| `Defer`           | `defer-content`                    | `[content]`              | `{ content }`              |
| `Defer`           | `defer-error`                      | `[error]`                | `{ error }`                |
| `Disclosure`      | `disclosure-*`                     | `[instance]`             | `null`                     |
| `DisclosureGroup` | `disclosure-group-open` / `-close` | `[item, index]`          | `{ item, index }`          |
| `DisclosureGroup` | `disclosure-group-change`          | `[openItems]`            | `{ items }`                |
| `Draggable`       | `drag-*`                           | `[props]`                | `props`                    |
| `Fetch`           | `fetch-*`                          | `[{ instance, url, … }]` | `{ instance, url, … }`     |
| `Indexable`       | `index`                            | `[index]`                | `{ index }`                |
| `Prefetch`        | `prefetched`                       | `[url]`                  | `{ url }`                  |
| `Sentinel`        | `intersected`                      | `[entries]`              | `{ isInView, entry }`      |
| `Tabs`            | `tabs-enable` / `tabs-disable`     | `[item]`                 | `{ index, btn, content }`  |
| `Timer`           | `timer-*`                          | `[]`                     | `null`                     |
| `TimerProgress`   | `timer-progress`                   | `[ratio]`                | `{ ratio }`                |
| `Toast`           | `dismiss`                          | `[element]`              | `{ el }`                   |
| `Toaster`         | `show`                             | `[toast, message, type]` | `{ toast, message, type }` |

`ClickOutside` is unchanged because v1 dispatched its own `CustomEvent` instead of using `$emit()`.

`@studiometa/ui-mapbox` changes the same way:

| Emitted by       | Event                | v1.x `detail`                | v2.x `detail`              |
| ---------------- | -------------------- | ---------------------------- | -------------------------- |
| a map child      | `map-error`          | `[error]`                    | `{ error }`                |
| `MapboxMap`      | `map-load`           | `[map]`                      | `{ map }`                  |
| `MapboxMap`      | `map-<mapbox event>` | `[event]`                    | `{ event }`                |
| `MapboxCluster`  | `map-update`         | `[items]`                    | `{ items }`                |
| `MapboxCluster`  | `map-cluster-click`  | `[clusterId, event]`         | `{ clusterId, event }`     |
| `MapboxCluster`  | `map-item-click`     | `[item, feature, event]`     | `{ item, feature, event }` |
| `MapboxImages`   | `map-ready`          | `[images]`                   | `{ images }`               |
| `MapboxImage`    | `map-ready`          | `[{ name, image, options }]` | `{ name, image, options }` |
| `MapboxGeocoder` | `map-result`         | `[result]`                   | `{ result }`               |
| `StoreLocator`   | `map-select`         | `[item]`                     | `{ item }`                 |
| `StoreLocator`   | `map-filter`         | `[items]`                    | `{ items }`                |

`map-error` has two shapes: `MapboxMap` forwards Mapbox's own error as `{ event }`, every map child emits `{ error }`. Both bubble, so read the payload by component. `StoreLocator`'s `map-deselect` carries no payload on either side.

## Renamed events

`$emit()` bubbles in v4, so a listener on a group heard its children under the old shared names.

| Component         | v1.x          | v2.x                      |
| ----------------- | ------------- | ------------------------- |
| `Disclosure`      | `open`        | `disclosure-open`         |
| `Disclosure`      | `close`       | `disclosure-close`        |
| `Disclosure`      | `after-open`  | `disclosure-after-open`   |
| `Disclosure`      | `after-close` | `disclosure-after-close`  |
| `DisclosureGroup` | `open`        | `disclosure-group-open`   |
| `DisclosureGroup` | `close`       | `disclosure-group-close`  |
| `DisclosureGroup` | `change`      | `disclosure-group-change` |
| `Tabs`            | `enable`      | `tabs-enable`             |
| `Tabs`            | `disable`     | `tabs-disable`            |

```diff
- <div data-component="Action Disclosure" data-on:after-open="…">
+ <div data-component="Action Disclosure" data-on:disclosure-after-open="…">
```

Removed events:

- `MotionView` no longer emits `toggle`. Its six `enter*` and `leave*` events are unchanged.
- `withTransition` no longer emits `transition-toggle`. Listen for `transition-enter` and `transition-leave`.

## Removed options and APIs

| v1.x                                    | v2.x                                           |
| --------------------------------------- | ---------------------------------------------- |
| `Tabs` `styles` option                  | removed — CSS, or a nested `Transition`        |
| `Tabs` `enableItem()` / `disableItem()` | `goTo(index)`                                  |
| `Transition` `group` option             | removed — one component drives the others      |
| `this.$options.reverse = true`          | `this.isReverse = true`                        |
| `this.$options.boundary = …`            | `this.boundary = …`                            |
| `viewTransition` from `@studiometa/ui`  | `viewTransition` from `@studiometa/js-toolkit` |

**`Disclosure` no longer writes its open state back to the DOM.** `data-option-open` is still an input option. A stylesheet selecting `[data-option-open]` after the first render must select `[aria-expanded="true"]` instead.

**`Dialog`'s `waitUntil` takes a different transitioner.** The events still bubble and the attribute wiring is unchanged. v1 accepted an object with `enter()` and `leave()`; v2 uses [`emitExtendable()`](https://js-toolkit-v4.studiometa.dev/api/dom/emitExtendable.html), which looks up a method named after the event. Pass a function for any other pair of names:

```diff
- event.detail.waitUntil(view);
+ event.detail.waitUntil(event.type === 'open' ? () => view.enter() : () => view.leave());
```

Thenables are unaffected. See [extending the lifecycle](/reference/items/Dialog/js-api#extending-the-lifecycle-with-waituntil).

To replace `Transition`'s `group`, give one component a list target:

```js
class Reveal extends withTransition(Base) {
  static config = { name: 'Reveal', refs: ['parts[]'] };

  get target() {
    return this.$refs.parts;
  }
}
```

### Removed subpaths

| Subpath                              | Replacement                     |
| ------------------------------------ | ------------------------------- |
| `@studiometa/ui/scheduler`           | `@studiometa/js-toolkit`        |
| `@studiometa/ui/types`               | removed with the `Frame` family |
| `@studiometa/ui/AbstractSliderChild` | `AbstractCarouselChild`         |

Every dropped or renamed component takes its subpath with it. New subpaths: `/AbstractFigure`, `/AbstractFigureDynamic`, `/AbstractTrack`, `/ActionEvent`, `/TrackEvent`, `/DataRegistry`.

### Removed types

| v1.x                                                                                                                                            | v2.x                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `CarouselStore`                                                                                                                                 | `CarouselState`, `CarouselApi`                   |
| `SliderStore`                                                                                                                                   | `CarouselState`, `CarouselApi`                   |
| `IndexableInstructions`                                                                                                                         | `IndexableInstruction`                           |
| `TransitionConstructor`, `FetchConstructor`, `FetchShopifyPartialConstructor`, `FetchShopifySectionConstructor`                                 | removed                                          |
| `ClickOutsideProps`, `TargetProps`, `CarouselItemProps`, `CarouselWrapperProps`, `AbstractCarouselChildProps`, `AbstractCarouselComponentProps` | removed — those components declare no props type |

`Disclosure` and `DisclosureGroup` lose their props type parameter: `Disclosure<MyProps>` no longer compiles. Extend the class and declare your own fields.

## js-toolkit v4 changes that reach your code

Each is covered in full by [the js-toolkit v3 → v4 guide](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html).

- **[`createApp()` is removed.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#createapp-is-removed)** Register the components a page uses.
- **[`registerComponent()` takes one argument.](https://js-toolkit-v4.studiometa.dev/api/registry/registerComponent.html)** Subclass to register under another name.
- **[`$children` and `$parent` are removed.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#parent-children-and-root-are-removed)** Use `$query()`, `$closest()` or `$watchChildren()`.
- **[`destroyed()` becomes `unmounted()`](https://js-toolkit-v4.studiometa.dev/guide/introduction/lifecycle-hooks.html)**, or return a cleanup function from `mounted()`. `updated()` is removed.
- **[`config.emits` becomes a type.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#config-emits-is-a-type-now)** Declare `$emits` on your props type.
- **[`$options` is read-only.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#options-is-read-only)** Write the attribute, or keep a private field.
- **[Every option is responsive.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#responsive-options-lose-the-list-syntax)** `withResponsiveOptions` is removed. `data-option-mode:xxs:xs:s="click"` becomes `data-option-mode="click"` plus `data-option-mode:m="hover"`.
- **[A boolean option reads presence.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#a-boolean-option-reads-presence)** `data-option-modal="false"` is `true`. Remove the attribute, or use `data-option-no-modal` for a true-default option. A Twig template must write the attribute conditionally.
- **[`Object` and `Array` defaults must be factories.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#non-primitive-defaults-must-be-factories)** `default: {}` becomes `default: () => ({})`.
- **[`data-load` becomes `data-mount`](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#data-load-becomes-data-mount)**. `withMountWhenInView` becomes `data-mount="visible"`; the observer margin is a suffix, `data-mount="in-view:50%"`.
- **[Handler payloads are one object.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#handler-payloads-are-one-object)** `onItemClick(event, index)` becomes `onItemClick({ event, target, index })`.
