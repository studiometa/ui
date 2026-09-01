# v1.x → v2.x

v2 runs on [`@studiometa/js-toolkit` v4](https://js-toolkit-v4.studiometa.dev/). It removes six component families, renames three components, rewrites `Tabs`, gives `Carousel` an accessibility contract, and changes every event payload. There is no compatibility layer.

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
5. Rewrite the markup of the [rewritten components](#rewritten-components).
6. Rewrite every `event.detail[0]` as a [named read](#event-payloads).
7. Rename the [renamed events](#renamed-events).
8. Check the [removed options, APIs, subpaths and types](#removed-options-and-apis).

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

### Removed templates

```diff
- {% include '@ui/ImageGrid/ImageGrid.twig' with { … } %}
- {% include '@ui/Reinsurance/Reinsurance.twig' with { … } %}
- {% include '@ui/Modal/StyledModal.twig' with { … } %}
- {% include '@ui/Panel/StyledPanel.twig' with { … } %}
```

Copy the template into your project if you still need it. Every Twig template other than `Tabs.twig` is unchanged, parameters included.

## New components

| v1.x                            | v2.x           |
| ------------------------------- | -------------- |
| a hand-rolled carousel autoplay | `CarouselPlay` |

`CarouselPlay` is a `<button>` inside the carousel, off unless the element is there. It extends `TimerProgress`, so `delay`, `repeat`, `autostart` and the `timer-*` events are the ones you already know. `Carousel` declares it, so `registerComponent(Carousel)` is enough.

Put it first inside the carousel: it must be the first focusable element. Turning the automatic start off is `data-option-no-autostart`, never `data-option-autostart="false"`.

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
| `disabled` on the current picker | `aria-disabled="true"` — a numeric `CarouselBtn` stays focusable    |

Steps:

1. Add an `aria-label` or an `aria-labelledby` to every `Carousel` root. Missing ones log `carousel.unnamed`.
2. Add a name to every icon-only or empty `CarouselBtn`. Missing ones log `carousel.unnamed-btn`.
3. Replace any CSS selecting `[data-component~="CarouselBtn"]:disabled` for a numeric action with `[aria-disabled="true"]`.
4. Translate the slide name with `data-option-slide-label` on a non-English page.
5. Remove any `role`, `aria-label` or `aria-roledescription` you were writing by hand only if you want the defaults; an attribute already in the markup is never overwritten.

`aria-roledescription` is not written. `Slider` emitted `carousel` and `slide` untranslated; nothing translates the attribute. Write it yourself if you want it.

### `CarouselDrag`

A hard flick now advances **one slide**. v1 projected the throw and jumped to whichever slide was nearest the predicted resting point, so a fast gesture could cross several.

| v1.x                                    | v2.x                                                  |
| --------------------------------------- | ----------------------------------------------------- |
| a flick lands on the nearest projection | a flick past the threshold advances exactly one slide |
| —                                       | `skip-snaps` option, restoring the v1 behaviour       |

The threshold is `clamp(20% of the track, 50, 225)` px of projected travel. Below it the throw still coasts to the nearest slide.

`skip-snaps` is a `CarouselDrag` option, so it goes on the wrapper, not on the carousel root:

```html
<div data-component="Carousel" aria-label="Featured products">
  <div data-component="CarouselWrapper CarouselDrag" data-option-skip-snaps>…</div>
</div>
```

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
| `Slider`          | `index`, `goto`                    | `[index]`                | `{ index }`                |
| `SliderDrag`      | `start`, `drag`, `drop`, …         | `[props]`                | `props`                    |
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
| `@studiometa/ui/AbstractSliderChild` | `SliderContext`                 |

Every dropped or renamed component takes its subpath with it. New subpaths: `/AbstractFigure`, `/AbstractFigureDynamic`, `/AbstractTrack`, `/ActionEvent`, `/TrackEvent`, `/DataRegistry`.

### Removed types

| v1.x                                                                                                                                                               | v2.x                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `CarouselStore`                                                                                                                                                    | `CarouselState`, `CarouselApi`                   |
| `SliderStore`                                                                                                                                                      | `SliderState`, `SliderApi`                       |
| `IndexableInstructions`                                                                                                                                            | `IndexableInstruction`                           |
| `TransitionConstructor`, `FetchConstructor`, `FetchShopifyPartialConstructor`, `FetchShopifySectionConstructor`                                                    | removed                                          |
| `ClickOutsideProps`, `TargetProps`, `CarouselItemProps`, `CarouselWrapperProps`, `AbstractCarouselChildProps`, `AbstractCarouselComponentProps`, `SliderItemProps` | removed — those components declare no props type |

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
