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

Open the dialog: call `showModal()` (or `show()` when `modal` is `false`), lock the scroll, emit `open`, then run every transition child's `enter()`. A no-op if the dialog is already open. Resolves once every enter transition has finished.

### `close`

- Returns `Promise<void>`

Close the dialog: emit `close`, run every transition child's `leave()`, **then** call `dialog.close()`, release the focus trap (non-modal path) and unlock the scroll. A no-op if the dialog is already closed. Resolves once closed.

### `toggle`

- Returns `Promise<void>`

Call `close()` if the dialog is open, `open()` otherwise.

## Events

Both lifecycle events bubble up the DOM tree, so ancestors can route them. Neither carries a `detail`.

### `open`

Emitted when the dialog starts opening, before the enter transitions run.

### `close`

Emitted when the dialog starts closing, before the leave transitions run.

## What the dialog waits for

`open()` and `close()` await the `enter()` and `leave()` of the dialog's [`Transition`](/reference/items/Transition/) and [`ViewTransition`](/reference/items/ViewTransition/) children, and nothing else. On `close`, the native dialog stays painted until every one of them settles.

A listener's own effect is **not** awaited. An [`Action`](/reference/items/Action/) bound to `open` or `close` runs while the dialog carries on:

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

The entrance plays as expected. The exit is cut off, because `dialog.close()` fires as soon as the transition children settle — and a `Motion` is not one of them. Put the animation on a `Transition` or `ViewTransition` child of the dialog whenever the dialog has to wait for it.

::: warning `waitUntil` is gone in v2
v1's `Dialog` dispatched `open` and `close` with a `detail.waitUntil()` function, modelled on the Service Worker [`ExtendableEvent`](https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil), which let any listener register an extension the dialog would await. v2 emits both events with no payload. See the [v1 → v2 migration guide](/migration-guides/1.0-2.0/#dialog-no-longer-exposes-waituntil).
:::
