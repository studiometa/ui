---
title: MotionView JS API
---

# JS API

Wrap DOM updates in Motion's [`animateView()`](https://motion.dev/docs/animate-view) so the change plays as a view transition. A drop-in alternative to the [`ViewTransition`](/reference/items/ViewTransition/) component — same `enter()`/`leave()`/`toggle()` methods, `state` property, events and `viewTransitionName`/`enterTo`/`leaveTo` options — but the animation is declared with Motion keyframes and transitions (including springs) instead of the `::view-transition-*` CSS pseudo-elements.

<!-- prettier-ignore-start -->
```html {2,3}
<div
  data-component="MotionView"
  data-option-enter-to="is-open"
  data-option-transition='{ "type": "spring", "bounce": 0.3 }'>
  …
</div>

<button data-component="Action" data-on:click="MotionView->target.toggle()">Toggle</button>
```
<!-- prettier-ignore-end -->

## Options

Object options are parsed as JSON: quote the keys (`data-option-new='{ "opacity": [0, 1] }'`).

### `viewTransitionName`

- Type: `string`
- Default: `''`

Assigned as the element's [`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name) on mount, exactly like `ViewTransition`. Optional with `MotionView`: `animateView()` names the subjects it animates automatically.

### `enterTo`

- Type: `string`
- Default: `''`

Classes describing the shown state. Added on `enter`, removed on `leave`.

### `leaveTo`

- Type: `string`
- Default: `''`

Classes describing the hidden state. Added on `leave`, removed on `enter`. Usually also the element's initial class so it starts hidden.

### `transition`

- Type: `ViewTransitionOptions`
- Default: `{}`

The root [`animateView()` options](https://motion.dev/docs/animate-view): a default transition (`duration`, `ease`, `type: "spring"`, …) for every layer of the view transition.

### `add`

- Type: `string`
- Default: `''`

A selector resolved within the component's element: every matched element becomes an animated subject of the transition. When empty, the element itself is the subject.

### `new`, `old`, `enter`, `exit`

- Type: `DOMKeyframesDefinition`
- Default: `{}`

Per-layer keyframes applied to each subject, mapping to the builder's [`new()`/`old()`/`enter()`/`exit()` methods](https://motion.dev/docs/animate-view): `new` and `old` animate the new and old views whether the element persists or not, while `enter` and `exit` only fire for a pure newcomer or leaver.

### `layout`

- Type: `boolean`
- Default: `false`

Enable the layout morph on each subject (the builder's `layout()`), so position and size changes animate smoothly.

### `auto`

- Type: `boolean`
- Default: `true`

Enable [ambient wiring](#ambient-wiring): the component wraps any `dom-update` announced inside its subtree and joins the lifecycle of a containing `Dialog`. Opt out with `data-option-no-auto`.

## Properties

### `state`

- Type: `'entering' | 'leaving' | null`

The current state of the transition: `'entering'` while entering, `'leaving'` while leaving, or `null` before any transition has run. `toggle()` reads it to decide which direction to run.

### `target`

- Type: `HTMLElement`

The element the `view-transition-name` and the enter and leave classes are applied to — the component's root element.

## Events

The same events as [`ViewTransition`](/reference/items/ViewTransition/js-api#events), in the same order: `enter`, `enter-start`, `enter-end` around the enter transition and `leave`, `leave-start`, `leave-end` around the leave transition.

## Methods

| Method           | Description                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `enter()`        | Swap `leaveTo` for `enterTo` inside a view transition. Resolves once the animation settles.                   |
| `leave()`        | Swap `enterTo` for `leaveTo` inside a view transition. Resolves once the animation settles.                   |
| `toggle()`       | Toggle between enter and leave, entering first.                                                               |
| `update(mutate)` | The underlying primitive: run any DOM mutation as a view transition configured by the options. Never rejects. |

## Ambient wiring

Containment is the wiring: with the `auto` option (on by default), a mounted `MotionView` listens for the bubbling `dom-update` event that mutating components — [`Fetch`](/reference/items/Fetch/), [`DataBind`](/reference/items/DataBind/)'s `data-bind:if` — announce before changing the DOM, and runs the announced change through `update()` so it plays as a view transition. Nesting the mutators inside the component is enough, with zero wiring attributes on either side:

<!-- prettier-ignore-start -->
```html {1}
<div data-component="MotionView" data-option-transition='{ "type": "spring", "bounce": 0.2 }'>
  <form action="/search" data-component="Fetch">
    <input type="search" name="q" />
  </form>

  <template data-component="DataBind" data-option-key="expanded" data-bind:if>
    <p>…</p>
  </template>
</div>
```
<!-- prettier-ignore-end -->

A `MotionView` also joins the lifecycle of an ancestor that emits **extendable** `open` and `close` events — those built with the toolkit's [`emitExtendable()`](https://js-toolkit-v4.studiometa.dev/api/dom/emitExtendable.html), whose `detail` carries a `waitUntil()` function. The component hands itself to `detail.waitUntil()`, and the host then awaits `enter()` on open and `leave()` on close.

::: warning Not wired to `Dialog` in v2
`@studiometa/ui`'s [`Dialog`](/reference/items/Dialog/) emitted such events in v1 but emits `open` and `close` with no payload in v2, so this ambient wiring never fires with it. Nest a `Transition` or `ViewTransition` inside the dialog instead, or call `enter()`/`leave()` from an [`Action`](/reference/items/Action/).
:::

Opt out with `data-option-no-auto`. Explicit wiring through [`Action`](/reference/items/Action/) remains for cross-subtree topologies, where the mutator and the animated subtree are not nested:

<!-- prettier-ignore-start -->
```html {4}
<form
  action="/search"
  data-component="Fetch Action"
  data-on:dom-update="MotionView(#list)->event.detail.wrap(target)">
  <input type="search" name="q" />
</form>

<ul id="list" data-component="MotionView">
  …
</ul>
```
<!-- prettier-ignore-end -->

## Notes

- The mutation is never lost: in browsers without the View Transitions API — or when the animation rejects — the update still applies, only without animation.
- `animateView()` is not part of `motion/mini`: when the [provided module](/reference/items/Motion/js-api#providing-the-motion-dependency) lacks it, the component warns and applies updates directly.
