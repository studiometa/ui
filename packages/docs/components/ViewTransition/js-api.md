---
title: ViewTransition JS API
outline: deep
---

# JS API

## Options

### `viewTransitionName`

- Type: `string`
- Default: `''`

Sets the [`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name) on the target element so it animates as its own snapshot. Each participating element must have a unique name. You can also set it directly in CSS instead of using this option.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="ViewTransition"
  data-option-view-transition-name="panel">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `enterTo`

- Type: `string`
- Default: `''`

Classes describing the shown state. Added on `enter`, removed on `leave`.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="ViewTransition"
  data-option-enter-to="opacity-100">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `leaveTo`

- Type: `string`
- Default: `''`

Classes describing the hidden state. Added on `leave`, removed on `enter`. This is usually also the element's initial class so it starts hidden.

<!-- prettier-ignore-start -->
```html {2,4}
<div data-component="ViewTransition"
  data-option-leave-to="translate-x-full"
  class="translate-x-full">
  ...
</div>
```
<!-- prettier-ignore-end -->

## Properties

### `target`

- Type: `HTMLElement`

A getter returning the target element for the transition. Defaults to the component's root element `this.$el`.

### `state`

- Type: `'entering' | 'leaving' | null`
- Default: `null`

The current state of the transition: `'entering'` while entering, `'leaving'` while leaving, or `null` before any transition.

## Methods

### `enter`

- Returns `Promise<void>`

Trigger the enter transition. Resolves once the view transition has finished.

### `leave`

- Returns `Promise<void>`

Trigger the leave transition. Resolves once the view transition has finished.

### `toggle`

- Returns `Promise<void>`

Toggle between enter and leave. Enters if currently leaving (or if no transition has run yet), leaves otherwise.

## Events

### `enter`

Emitted when the enter transition is triggered.

### `enter-start`

Emitted at the start of the enter transition, before the state change is applied.

### `enter-end`

Emitted when the enter transition completes.

### `leave`

Emitted when the leave transition is triggered.

### `leave-start`

Emitted at the start of the leave transition, before the state change is applied.

### `leave-end`

Emitted when the leave transition completes.

### `toggle`

Emitted when the `toggle` method is called.

## Batching

Every `enter` / `leave` call made within the same microtask is coalesced into a **single** `document.startViewTransition()` call, and batches are serialized across ticks. This is what lets several elements animate together as one coordinated transition. When the API is unavailable, the state change is applied synchronously with no animation.
