---
title: Dialog JS API
outline: deep
---

# JS API

## Options

### `modal`

- Type: `Boolean`
- Default: `true`

Open the dialog as a true modal with [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal): the platform then handles the focus trap, makes the rest of the page [`inert`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert), restores focus on close and paints the dialog in the top layer. Set it to `false` (via `data-option-no-modal`) to use [`show()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/show) instead, which keeps the rest of the page interactive (useful for a slide-in nav).

<!-- prettier-ignore-start -->
```html {2}
<dialog data-component="Action Dialog"
  data-option-no-modal>
  ...
</dialog>
```
<!-- prettier-ignore-end -->

### `trapFocus`

- Type: `Boolean`
- Default: `true`

Trap the tabulation inside the dialog. This is **only meaningful on the non-modal path** (`modal: false`): `showModal()` already traps focus natively, so the option is a no-op when `modal` is `true`. On the non-modal path it saves the active element on open, keeps <kbd>Tab</kbd> inside the dialog while open, and restores focus on close.

<!-- prettier-ignore-start -->
```html {3}
<dialog data-component="Action Dialog"
  data-option-no-modal
  data-option-no-trap-focus>
  ...
</dialog>
```
<!-- prettier-ignore-end -->

### `scrollLock`

- Type: `Boolean`
- Default: `true`

Lock the scroll on the document element while the dialog is open by toggling `document.documentElement.style.overflow`. Set it to `false` with `data-option-no-scroll-lock` to leave the page scrollable.

## Properties

### `dialog`

- Type: `HTMLDialogElement`

A getter returning the native `<dialog>` element (`this.$el`).

### `transitions`

- Type: `Transitionable[]`

A getter returning every [`Transition`](/reference/items/Transition/) and [`ViewTransition`](/reference/items/ViewTransition/) child the dialog orchestrates.

## Methods

### `open`

- Returns `Promise<void>`

Open the dialog: call `showModal()` (or `show()` when `modal` is `false`), lock the scroll, emit the extendable `open` event and run every transition child's `enter()`. A no-op if the dialog is already open. Resolves once every enter transition **and** every registered extension has finished — the dialog itself is painted before any of that.

### `close`

- Returns `Promise<void>`

Close the dialog: emit the extendable `close` event and run every transition child's `leave()`, await both, **then** call `dialog.close()`, release the focus trap (non-modal path) and unlock the scroll. A no-op if the dialog is already closed. Two overlapping calls share one run rather than closing twice. Resolves once closed.

### `toggle`

- Returns `Promise<void>`

Call `close()` if the dialog is open, `open()` otherwise.

## Events

Both lifecycle events are **extendable**: they bubble up the DOM tree, so ancestors can route them, and their `detail` carries a `waitUntil()` function any listener can call to hold the dialog's choreography open. They are dispatched with the toolkit's [`emitExtendable()`](https://js-toolkit-v4.studiometa.dev/api/dom/emitExtendable.html), modelled on the Service Worker [`ExtendableEvent`](https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil).

### `open`

- Detail: `{ waitUntil(extension) }`

Emitted when the dialog starts opening, after the native dialog is painted and before the enter transitions run.

### `close`

- Detail: `{ waitUntil(extension) }`

Emitted when the dialog starts closing, before the leave transitions run and before the native dialog hides.

::: warning A `<dialog>` also fires a native `close`
The platform fires its own `close` event on the element once it has hidden, with no `detail`. It shares the name of the extendable one and arrives **after** the choreography. A listener that reads `detail.waitUntil` has to check it is there — a plain `event.detail?.waitUntil` guard is enough.
:::

## Extending the lifecycle with `waitUntil`

`waitUntil()` registers work the dialog must wait for. It is what lets a component that is **not** a declared child — or plain JavaScript — join the choreography:

```js
dialog.$on('close', (event) => {
  event.detail?.waitUntil(fadeOut(panel));
});
```

On `open` the registration holds `open()`'s promise pending; the native dialog is painted first, so nothing delays the dialog appearing. On `close` the dialog stays **painted and scroll-locked** until every registration settles, and only then hides.

### What it accepts

| Shape                     | Example                         |
| ------------------------- | ------------------------------- |
| a thenable                | `waitUntil(view.leave())`       |
| a function                | `waitUntil(() => view.leave())` |
| an object with the method | `waitUntil({ close() { … } })`  |

The duck-typed method has the name of **the event** — `open()` on open, `close()` on close.

::: warning Changed from v1
v1 duck-typed a _transitioner_: an object with `enter()` and `leave()`, `enter()` awaited on `open` and `leave()` on `close`. v2 delegates to the shared `emitExtendable()` primitive, whose lookup keys on the event name instead. A component implementing [`Transitionable`](/reference/items/Transition/) joins with the function form:

```js
// v1
event.detail.waitUntil(view);
// v2
event.detail.waitUntil(event.type === 'open' ? () => view.enter() : () => view.leave());
```

:::

### The rules

- **A registration is only valid while the event dispatches.** Keeping `waitUntil` and calling it later is refused and reported as `protocol.late-registration`.
- **Every registration is awaited**, not just the last: any number of components can animate one dialog without knowing about each other.
- **The step happens anyway.** An extension that rejects is reported as `callback.extendable-event-extension-failed` and swallowed — a failing extension must never leave the dialog painted and the page locked.

## What the dialog waits for

Two mechanisms hold the dialog open, and they never overlap:

1. **The declared children.** `open()` and `close()` fan `enter()` and `leave()` out to every [`Transition`](/reference/items/Transition/) and [`ViewTransition`](/reference/items/ViewTransition/) child.
2. **The extendable events.** Anything registered with `waitUntil()`, from anywhere.

The events are dispatched on the dialog element and bubble **upwards**, so a declared child never receives them and cannot register itself a second time. Both start in the same tick and are awaited by a single `Promise.all`, so they run concurrently: a slow extension does not delay the children, and the children do not delay it. On `close`, the native dialog stays painted until the last of them settles.

A listener's own effect is not awaited **unless it registers**. An [`Action`](/reference/items/Action/) bound to `open` or `close` runs while the dialog carries on:

<!-- prettier-ignore-start -->
```html {3,4}
<dialog
  data-component="Action Dialog"
  data-on:open="Motion(#box)->target.play()"
  data-on:close="Motion(#box)->target.reverse()"
  data-on:cancel.prevent="Dialog.close()">
  …
</dialog>
```
<!-- prettier-ignore-end -->

The entrance plays as expected. The exit is cut off, because `dialog.close()` fires as soon as the transition children settle — and a `Motion` is not one of them. Put the animation on a `Transition` or `ViewTransition` child of the dialog, or register it with `waitUntil()`, whenever the dialog has to wait for it.
