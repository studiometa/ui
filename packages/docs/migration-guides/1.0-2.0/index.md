# v1.x → v2.x

You will find on this page documentation on all the breaking changes included in the v2.x of the package.

v2 is a full breaking major. It moves the whole package onto [`@studiometa/js-toolkit` v4](https://js-toolkit-v4.studiometa.dev/), removes six families whose job another component now does better, renames three components, and changes how every event carries its payload. There is no compatibility layer and no bridge release: `@studiometa/js-toolkit` 4.0 and `@studiometa/ui` 2.0 ship together.

[[toc]]

## Update `@studiometa/js-toolkit` to v4

`@studiometa/ui` v2 declares `@studiometa/js-toolkit` v4 as a peer dependency.

```diff
   "dependencies": {
-    "@studiometa/js-toolkit": "^3.0.0",
-    "@studiometa/ui": "^1.0.0"
+    "@studiometa/js-toolkit": "^4.0.0",
+    "@studiometa/ui": "^2.0.0"
   }
```

Read [the js-toolkit v3 → v4 migration guide](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html) first. It is the framework half of this migration and it is the larger half. The sections below only cover what `@studiometa/ui` itself changes, plus a short summary of [the framework changes that reach your own components](#the-js-toolkit-v4-changes-that-reach-your-code).

## Registering components

Registration is unchanged: import the components a page uses and hand them to `registerComponent()` or `registerComponents()`, exactly as in v1.

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Disclosure, DisclosureGroup, Fetch } from '@studiometa/ui';

registerComponents(Disclosure, DisclosureGroup, Fetch);
```

Two things around it did change.

**`registerComponent()` takes one argument.** The second alias-or-selector parameter is gone, so a v1 call that passed one registers nothing useful in v2. Aliasing is now a subclass with its own `config.name`.

```diff
- registerComponent(AnchorScrollTo, 'a[href^="#"]');
```

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { ScrollTo } from '@studiometa/ui';

class SmoothAnchor extends ScrollTo {
  static config = { name: 'SmoothAnchor' };
}

registerComponent(SmoothAnchor);
```

**`createApp()` is gone**, so an application class is no longer a way to mount a tree. Registering a component registers everything its `config.components` declares, which covers the same ground for a family; see [Usage](/guide/usage/) and [Autoloading](/guide/autoloading/).

## Removed components

### `Accordion` → `Disclosure` + `DisclosureGroup`

The `Accordion` and `AccordionItem` components are removed. `Disclosure` covers everything `AccordionItem` did — open and close, transitions, ARIA synchronisation — and `DisclosureGroup` expresses "accordion" as a configuration rather than a separate component.

Before, in v1:

```html
<div data-component="Accordion" data-option-autoclose>
  <div data-component="AccordionItem">
    <button data-ref="btn">Title</button>
    <div data-ref="container">
      <div data-ref="content">Content</div>
    </div>
  </div>
</div>
```

After, in v2:

```html
<div data-component="DisclosureGroup" data-option-no-multiple>
  <div data-component="Disclosure">
    <button data-ref="trigger" id="item-trigger">Title</button>
    <div data-ref="panel" id="item-panel">Content</div>
  </div>
</div>
```

`Disclosure` wires `aria-controls` from the trigger to the panel and `aria-labelledby` back, so both elements need an `id`. The `Disclosure.twig` template writes them for you.

| v1.x                            | v2.x                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `Accordion`                     | `DisclosureGroup`                                                                  |
| `AccordionItem`                 | `Disclosure`                                                                       |
| `data-option-autoclose`         | `data-option-no-multiple`                                                          |
| `AccordionItem` `btn` ref       | `Disclosure` `trigger` ref                                                         |
| `AccordionItem` `content` ref   | `Disclosure` `panel` ref                                                           |
| `AccordionItem` `container` ref | removed — the open and close animation is a `Transition` or `ViewTransition` child |
| `data-option-is-open`           | `data-option-open`                                                                 |
| `data-option-styles`            | removed — same reason                                                              |

`data-option-autoclose` and `data-option-no-multiple` are not merely renamed, they are inverted: `autoclose` was off by default, while `multiple` is **on** by default. A group with no option at all lets several disclosures stay open, which is what an `Accordion` without `autoclose` did.

`DisclosureGroup` also adds a `collapsible` option, on by default, which decides whether the last open disclosure can be closed. See [Disclosure](/reference/items/Disclosure/).

### `Frame` → `Fetch`

The whole `Frame` family is removed: `Frame`, `FrameAnchor`, `FrameForm`, `FrameLoader`, `FrameTarget`, `FrameTriggerLoader` and `AbstractFrameTrigger`, along with the `@studiometa/ui/types` subpath that held their event types. [`Fetch`](/reference/items/Fetch/) replaces all of it.

**`Fetch` is declared on the anchor or the form itself.** `Frame` wrapped a region and delegated to `FrameAnchor` and `FrameForm` child classes; `Fetch` needs none of them, because it acts on its own element — every path in the class resolves against `this.$el`, which its props type declares as `HTMLAnchorElement | HTMLFormElement`. It does not look at descendants, so **each** link or form you want intercepted carries its own `data-component="Fetch"`.

The target is matched by `[id]` selector against the fetched document, so a `FrameTarget` declaration is replaced by a plain `id`, and there is no `FrameLoader` equivalent — listen for the `fetch-*` events instead.

Before, in v1:

```html
<div data-component="Frame" data-option-history>
  <a data-component="FrameAnchor" href="/page-2">Page 2</a>
  <a data-component="FrameAnchor" href="/page-3">Page 3</a>
  <div data-component="FrameTarget" id="content">…</div>
  <div data-component="FrameLoader">Loading…</div>
</div>
```

After, in v2:

```html
<a data-component="Fetch" data-option-history href="/page-2">Page 2</a>
<a data-component="Fetch" data-option-history href="/page-3">Page 3</a>

<div id="content">…</div>
```

The two do not have to be siblings, and the `id` element does not have to sit inside anything: `Fetch` replaces every `[id]` element of the current document that the response also contains.

To keep a single declaration on a region rather than one per link, mount `Fetch` on any element with the [`src` option](/reference/items/Fetch/js-api#src) and call its `fetch()` method yourself — from an [`Action`](/reference/items/Action/), for example.

The event names change with the component. `Frame` emitted `frame-fetch-before`, `frame-fetch`, `frame-fetch-after`, `frame-content`, `frame-content-after`, `frame-error` and `frame-trigger`; `Fetch` emits the `fetch-` prefixed set listed on [its API page](/reference/items/Fetch/js-api).

### `Modal` and `Panel` → `Dialog`

`Modal`, `ModalWithTransition` and `Panel` are removed. [`Dialog`](/reference/items/Dialog/) replaces them, built on the native `<dialog>` element: the browser provides the focus trap, the backdrop and the top-layer stacking that `Modal` implemented by hand.

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

`Dialog`'s root element **must** be a `<dialog>`. Its `open()`, `close()` and `toggle()` methods are asynchronous and resolve once the child transitions have run. The `move`, `autofocus` and `styles` options have no equivalent: nest a [`Transition`](/reference/items/Transition/) or [`ViewTransition`](/reference/items/ViewTransition/) child to animate, and let the native element handle focus.

`Panel`'s `position` option and its translate classes are gone too. There is no `Drawer` component either: a drawer is a `Dialog` whose panel you anchor to an edge with your own CSS, optionally sliding it in with a `Transition` child. See [Building a drawer](/reference/items/Dialog/#building-a-drawer).

### `ScrollAnimation` → `@studiometa/ui-motion`

The whole `ScrollAnimation` family is removed — `ScrollAnimation`, `ScrollAnimationParent`, `ScrollAnimationChild`, `ScrollAnimationChildWithEase`, `ScrollAnimationWithEase`, `ScrollAnimationTimeline`, `ScrollAnimationTarget` and `AbstractScrollAnimation` — together with the `animationScrollWithEase` decorator and the `withScrollAnimationDebug` decorator.

::: warning If you read this page before v2 shipped
An earlier draft of this guide told you to migrate `ScrollAnimation` to `ScrollAnimationTimeline` and `ScrollAnimationTarget`. That refactor never shipped. Those two components do not exist in v2 either; the whole family is replaced by [`@studiometa/ui-motion`](/reference/items/Motion/).
:::

[`@studiometa/ui-motion`](/reference/items/Motion/) is a separate package built on the Web Animations API. A scroll-driven animation is a [`Motion`](/reference/items/Motion/) whose timeline is a [`MotionScrollTimeline`](/reference/items/MotionScrollTimeline/).

Before, in v1 — the animated element is the `target` ref:

```html
<div
  data-component="ScrollAnimation"
  data-option-from='{ "opacity": 0, "y": 100 }'
  data-option-to='{ "opacity": 1, "y": 0 }'>
  <div data-ref="target">Content to animate</div>
</div>
```

After, in v2 — the `Motion` animates its own element, and the timeline is its ancestor:

```html
<div data-component="MotionScrollTimeline">
  <div
    data-component="Motion"
    data-option-initial='{ "opacity": 0, "y": 100 }'
    data-option-animate='{ "opacity": 1, "y": 0 }'>
    Content to animate
  </div>
</div>
```

```diff
   "dependencies": {
+    "@studiometa/ui-motion": "^2.0.0"
   }
```

`ScrollAnimation`'s `from` and `to` options map onto `Motion`'s `initial` and `animate`. The rest of the vocabulary is Motion's rather than the library's: there is no `playRange`, no `easing` array and no `dampFactor` — timing and smoothing are described with `Motion`'s `transition` option and with `MotionScrollTimeline`'s `offset`. Read the [`Motion` examples](/reference/items/Motion/examples) and the [`MotionScrollTimeline` page](/reference/items/MotionScrollTimeline/) before converting.

### The `ImageGrid`, `Reinsurance`, `StyledModal` and `StyledPanel` templates

These four Twig templates carried presentation opinions rather than behaviour, and are removed with no replacement. `StyledModal.twig` and `StyledPanel.twig` go with the `Modal` and `Panel` components they styled.

```diff
- {% include '@ui/ImageGrid/ImageGrid.twig' with { … } %}
- {% include '@ui/Reinsurance/Reinsurance.twig' with { … } %}
- {% include '@ui/Modal/StyledModal.twig' with { … } %}
- {% include '@ui/Panel/StyledPanel.twig' with { … } %}
```

Copy the template you were using into your own project if you still need it. Every other Twig template is unchanged in v2, parameters included.

### `withIndex` → `Indexable`

The `withIndex` decorator is removed. Its whole body is now the [`Indexable`](/reference/items/Indexable/) class, which v1 already shipped alongside it.

```diff
- import { Base } from '@studiometa/js-toolkit';
- import { withIndex } from '@studiometa/ui';
-
- class Gallery extends withIndex(Base) {
+ import { Indexable } from '@studiometa/ui';
+
+ class Gallery extends Indexable {
    static config = {
      name: 'Gallery',
    };
  }
```

`Indexable` keeps the decorator's whole surface — the `boundary`, `reverse` and `total` options, and the navigation methods. Its `index` event now carries `{ index }` rather than the bare number: see [Event payloads](#every-event-payload-is-one-object).

## Renamed components

Each renamed component keeps its API. Only the class name, the `data-component` value, the import subpath and — for `LazyInclude` — the event names change.

| v1.x               | v2.x                    |
| ------------------ | ----------------------- |
| `LazyInclude`      | `Defer`                 |
| `AnchorScrollTo`   | `ScrollTo`              |
| `PrefetchWhenOver` | `PrefetchOnInteraction` |

::: danger The old documentation URLs are gone
`/reference/items/LazyInclude/`, `/reference/items/AnchorScrollTo/` and the `PrefetchWhenOver` anchor now return a 404. Follow the table above to the new pages.
:::

### `LazyInclude` → `Defer`

```diff
- import { LazyInclude } from '@studiometa/ui';
- import { LazyInclude } from '@studiometa/ui/LazyInclude';
+ import { Defer } from '@studiometa/ui';
+ import { Defer } from '@studiometa/ui/Defer';
```

```diff
- <div data-component="LazyInclude" data-option-src="/fragment.html">
+ <div data-component="Defer" data-option-src="/fragment.html">
    <div data-ref="loading">Loading…</div>
    <div data-ref="error">Something went wrong.</div>
  </div>
```

Its three events take the family prefix, matching what `Fetch` already did:

| v1.x      | v2.x            | `detail` in v2.x |
| --------- | --------------- | ---------------- |
| `content` | `defer-content` | `{ content }`    |
| `error`   | `defer-error`   | `{ error }`      |
| `always`  | `defer-always`  | `null`           |

```diff
- <div data-component="Action LazyInclude" data-on:content="…">
+ <div data-component="Action Defer" data-on:defer-content="…">
```

### `AnchorScrollTo` → `ScrollTo`

```diff
- import { AnchorScrollTo } from '@studiometa/ui';
+ import { ScrollTo } from '@studiometa/ui';
```

```diff
- <a href="#section" data-component="AnchorScrollTo">Go to section</a>
+ <a href="#section" data-component="ScrollTo">Go to section</a>
```

`AnchorNavLink` extends it and follows the rename with no change of its own.

### `PrefetchWhenOver` → `PrefetchOnInteraction`

```diff
- import { PrefetchWhenOver } from '@studiometa/ui';
+ import { PrefetchOnInteraction } from '@studiometa/ui';
```

```diff
- <a href="/page" data-component="PrefetchWhenOver">Page</a>
+ <a href="/page" data-component="PrefetchOnInteraction">Page</a>
```

The name says what it does, and the behaviour is wider than v1's: `PrefetchWhenOver` bound `mouseenter`, which never fires for a touch or for the keyboard. `PrefetchOnInteraction` prefetches on whichever of `pointerenter`, `pointerdown` or `focusin` comes first.

## Events

### Every event payload is one object

**In v1 the `detail` of every event was an array.** js-toolkit v3 built each one as `new CustomEvent(name, { detail: args })`, so `detail` held the positional arguments the component emitted — `[content]`, `[item, index]`, or `[]` for an event emitted with none.

In v4 `$emit()` takes a single payload object and `detail` **is** that object. An event emitted with no payload leaves `detail` at the platform value `null`.

```diff
  element.addEventListener('prefetched', (event) => {
-   console.log(event.detail[0]); // the URL
+   console.log(event.detail.url);
  });
```

**Every `event.detail[0]` in a v1 codebase has to become a named read**, including for the components whose payload was already a single object — `Fetch`'s `fetch-*` events and `Draggable`'s `drag-*` events were `[{ … }]` in v1 and are `{ … }` in v2.

What the object now holds, for the components that survive:

| Component         | Event                                  | v1.x `detail`            | v2.x `detail`              |
| ----------------- | -------------------------------------- | ------------------------ | -------------------------- |
| `Carousel`        | `progress`                             | `[progress]`             | `{ progress }`             |
| `ClickOutside`    | `click-outside`                        | `{ event }`              | `{ event }` — unchanged    |
| `Defer`           | `defer-content`                        | `[content]`              | `{ content }`              |
| `Defer`           | `defer-error`                          | `[error]`                | `{ error }`                |
| `Disclosure`      | `disclosure-open` and the three others | `[instance]`             | `null`                     |
| `DisclosureGroup` | `disclosure-group-open` / `-close`     | `[item, index]`          | `{ item, index }`          |
| `DisclosureGroup` | `disclosure-group-change`              | `[openItems]`            | `{ items }`                |
| `Draggable`       | `drag-*`                               | `[props]`                | `props`                    |
| `Fetch`           | `fetch-*`                              | `[{ instance, url, … }]` | `{ instance, url, … }`     |
| `Indexable`       | `index`                                | `[index]`                | `{ index }`                |
| `Prefetch`        | `prefetched`                           | `[url]`                  | `{ url }`                  |
| `Sentinel`        | `intersected`                          | `[entries]`              | `{ isInView, entry }`      |
| `Slider`          | `index` and `goto`                     | `[index]`                | `{ index }`                |
| `SliderDrag`      | `start`, `drag`, `drop`, …             | `[props]`                | `props`                    |
| `Timer`           | `timer-start` and the others           | `[]`                     | `null`                     |
| `TimerProgress`   | `timer-progress`                       | `[ratio]`                | `{ ratio }`                |
| `Toast`           | `dismiss`                              | `[element]`              | `{ el }`                   |
| `Toaster`         | `show`                                 | `[toast, message, type]` | `{ toast, message, type }` |

`ClickOutside` is the one exception: v1 dispatched its own `CustomEvent` rather than going through `$emit()`, so its `detail` was already `{ event }`.

The `@studiometa/ui-mapbox` events change the same way:

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

See the [`MapboxMap` API](/reference/items/MapboxMap/js-api). `StoreLocator`'s `map-deselect` carries no payload on either side.

::: warning `map-error` has two shapes
`MapboxMap` forwards Mapbox's own `error` event as `map-error` with `{ event }`, while every map child emits `map-error` with `{ error }`. Both bubble, so an ancestor listening for `map-error` should read the payload by component.
:::

### `MotionView` no longer emits `toggle`

`@studiometa/ui-motion`'s `MotionView` declared a `toggle` event in v1 and does not emit one in v2. Its six `enter*` and `leave*` events are unchanged.

### `Disclosure` and `DisclosureGroup` events are namespaced

Both sides emitted a bare `open` and `close` in v1. v4's `$emit()` bubbles, so a listener on the group's element now hears its children too, and under the old names the two arrived indistinguishable. Both sides take a family prefix.

| Component         | v1.x          | v2.x                      |
| ----------------- | ------------- | ------------------------- |
| `Disclosure`      | `open`        | `disclosure-open`         |
| `Disclosure`      | `close`       | `disclosure-close`        |
| `Disclosure`      | `after-open`  | `disclosure-after-open`   |
| `Disclosure`      | `after-close` | `disclosure-after-close`  |
| `DisclosureGroup` | `open`        | `disclosure-group-open`   |
| `DisclosureGroup` | `close`       | `disclosure-group-close`  |
| `DisclosureGroup` | `change`      | `disclosure-group-change` |

`Disclosure`'s four events also lose their payload: they used to carry the instance, which the listener already has as `event.target`.

```diff
- <div data-component="Action Disclosure" data-on:after-open="…">
+ <div data-component="Action Disclosure" data-on:disclosure-after-open="…">
```

### `withTransition` no longer emits `transition-toggle`

The `transition-toggle` event is removed. Listen for `transition-enter` and `transition-leave`, which are emitted on every run.

## Removed options and APIs

### `Disclosure` no longer writes its open state back to the DOM

`data-option-open` is still an input option: write it in your markup to have a disclosure mount open. What v2 removes is the write in the other direction — an open disclosure no longer sets `data-option-open` on its own element.

`aria-expanded` on the trigger is the statement of open state, in v2 as in v1. A stylesheet that selected on `[data-option-open]` after the first render must select on `[aria-expanded="true"]` instead.

### The `Transition` `group` option is removed

`withTransition`'s `group` option collected sibling instances through a global registry that v4 does not keep. It has no equivalent. To run several transitions as one gesture, have one component drive the others:

```js
import { Base } from '@studiometa/js-toolkit';
import { withTransition } from '@studiometa/ui';

class Reveal extends withTransition(Base) {
  static config = { name: 'Reveal', refs: ['parts[]'] };

  // A list target transitions every element as one gesture.
  get target() {
    return this.$refs.parts;
  }
}
```

### `Dialog` no longer exposes `waitUntil`

v1's `Dialog` dispatched its `open` and `close` events with a `detail.waitUntil()` function, modelled on the Service Worker `ExtendableEvent`, which let any listener register an extension the dialog would await. **v2 emits both events with no payload and awaits only its declared `Transition` and `ViewTransition` children.**

```diff
  <dialog
    data-component="Dialog"
-   data-on:open="Motion(#box)->event.detail.waitUntil(target.play())"
-   data-on:close="Motion(#box)->event.detail.waitUntil(target.reverse())">
+   data-on:open="Motion(#box)->target.play()"
+   data-on:close="Motion(#box)->target.reverse()">
```

The effect still runs, but the dialog no longer waits for it: a close animation driven this way is cut off when `dialog.close()` fires. Put the animation on a `Transition` or `ViewTransition` child of the dialog when the dialog must wait for it.

### `viewTransition` moved to `@studiometa/js-toolkit`

The `viewTransition()` helper and the `@studiometa/ui/scheduler` subpath are removed, because js-toolkit v4 absorbed both.

```diff
- import { viewTransition } from '@studiometa/ui';
- import { viewTransition } from '@studiometa/ui/scheduler';
+ import { viewTransition } from '@studiometa/js-toolkit';
```

### Removed import subpaths

Every dropped or renamed component takes its subpath with it. Two more disappear for their own reasons:

| Subpath                              | Replacement                     |
| ------------------------------------ | ------------------------------- |
| `@studiometa/ui/scheduler`           | `@studiometa/js-toolkit`        |
| `@studiometa/ui/types`               | removed with the `Frame` family |
| `@studiometa/ui/AbstractSliderChild` | absorbed into `SliderContext`   |

New subpaths appear for surface the port exposes: `@studiometa/ui/AbstractFigure`, `/AbstractFigureDynamic`, `/AbstractTrack`, `/ActionEvent`, `/TrackEvent` and `/DataRegistry`.

### Removed types

Several exported types no longer exist, either because their component is gone or because the v2 implementation does not declare them.

| v1.x type                                                                                                                                                                               | v2.x                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `CarouselStore`                                                                                                                                                                         | `CarouselState` and `CarouselApi`                |
| `SliderStore`                                                                                                                                                                           | `SliderState` and `SliderApi`                    |
| `IndexableInstructions`                                                                                                                                                                 | `IndexableInstruction`                           |
| `IndexableInterface`, `TransitionConstructor`, `FetchConstructor`, `FetchShopifyPartialConstructor`, `FetchShopifySectionConstructor`                                                   | removed, with no replacement                     |
| `ClickOutsideProps`, `TargetProps`, `CarouselItemProps`, `CarouselWrapperProps`, `CarouselDragProps`, `AbstractCarouselChildProps`, `AbstractCarouselComponentProps`, `SliderItemProps` | removed — those components declare no props type |

`Disclosure` and `DisclosureGroup` also lose their props type parameter, so `Disclosure<MyProps>` no longer compiles. Extend the class and declare your own fields instead.

## The js-toolkit v4 changes that reach your code

These are the framework changes most likely to break a `@studiometa/ui` consumer. Each one is covered in full by [the js-toolkit v3 → v4 migration guide](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html).

- **[`createApp()` is removed.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#createapp-is-removed)** There is no root component and no application object. Register the components a page uses.
- **[`registerComponent()` takes one argument.](https://js-toolkit-v4.studiometa.dev/api/registry/registerComponent.html)** The second selector or alias parameter is gone. To register a component under another name, subclass it and give the subclass its own `config.name`.
- **[`$children` and `$parent` are removed.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#parent-children-and-root-are-removed)** Use `$query(name)`, `$closest(name)` or — better — `$watchChildren(name)`.
- **[`destroyed()` is now `unmounted()`](https://js-toolkit-v4.studiometa.dev/guide/introduction/lifecycle-hooks.html)**, and `mounted()` can return its own cleanup function instead. `updated()` is removed with no direct replacement.
- **[`config.emits` is a type, not a config entry.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#config-emits-is-a-type-now)** Declare `$emits` on your props type; nothing of it stays in the bundle.
- **[`$options` is read-only.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#options-is-read-only)** Assigning to an option throws. Write the attribute the option reads, or keep a private field.
- **[Every option is responsive](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#responsive-options-lose-the-list-syntax)**, with nothing to declare. `withResponsiveOptions` is gone, and a suffix names one breakpoint and cascades upwards: `data-option-mode:xxs:xs:s="click"` becomes `data-option-mode="click"` plus `data-option-mode:m="hover"`.
- **[A boolean option reads presence.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#a-boolean-option-reads-presence)** The attribute's value is never read, so `data-option-modal="false"` is `true`. Turn an option off by removing the attribute, or — for an option whose default is `true` — with the negated spelling `data-option-no-modal`. A Twig template must write the attribute conditionally rather than interpolate a boolean into it.
- **[`Object` and `Array` defaults must be factories.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#non-primitive-defaults-must-be-factories)** `default: {}` becomes `default: () => ({})`; a literal is shared between instances.
- **[`data-load` becomes `data-mount`](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#data-load-becomes-data-mount)**, and the `withMountWhen*` decorators are replaced by mount strategies. `data-mount="visible"` replaces `withMountWhenInView`, and the observer margin is a suffix: `data-mount="in-view:50%"`.
- **[Handler payloads are one object.](https://js-toolkit-v4.studiometa.dev/guide/migration/v3-to-v4.html#handler-payloads-are-one-object)** `onItemClick(event, index)` becomes `onItemClick({ event, target, index })`.
