---
title: Transition JS API
outline: deep
---

# JS API

## Options

### `enterFrom`

- Type: `string`
- Default: `''`

Defines the classes that describe the initial state of the enter transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-enter-from="opacity-0">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `enterActive`

- Type: `string`
- Default: `''`

Defines the classes that describe the transitioning state of the enter transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-enter-active="transition duration-500">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `enterTo`

- Type: `string`
- Default: `''`

Defines the classes that describe the end state of the enter transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-enter-to="opacity-90">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `enterKeep`

- Type: `boolean`
- Default: `false`

Configures whether or not the `enterTo` classes should be kept on the target element at the end of the enter transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-enter-keep>
  ...
</div>
```
<!-- prettier-ignore-end -->

### `leaveFrom`

- Type: `string`
- Default: `''`

Defines the classes that describe the initial state of the leave transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-leave-from="opacity-0">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `leaveActive`

- Type: `string`
- Default: `''`

Defines the classes that describe the transitioning state of the leave transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-leave-active="transition duration-500">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `leaveTo`

- Type: `string`
- Default: `''`

Defines the classes that describe the end state of the leave transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-leave-to="opacity-90">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `leaveKeep`

- Type: `boolean`
- Default: `false`

Configures whether or not the `leaveTo` classes should be kept on the target element at the end of the leave transition.

<!-- prettier-ignore-start -->
```html {2}
<div data-component="Transition"
  data-option-leave-keep>
  ...
</div>
```
<!-- prettier-ignore-end -->

## Properties

### `target`

- Type: `HTMLElement | HTMLElement[]`

A getter returning the target of the transition: one element, or several which transition as one gesture. Defaults to the component's root element `this.$el`.

### `state`

- Type: `'entering' | 'leaving' | null`
- Default: `null`

The current state of the transition. Will be `'entering'` when an enter transition is in progress, `'leaving'` when a leave transition is in progress, or `null` when no transition is active.

## Methods

### `enter`

- Signature: `enter(target?: HTMLElement | HTMLElement[]): Promise<void>`
- Returns `Promise<void>`

Trigger the enter transition. Pass a target to transition something other than the `target` getter's value.

### `leave`

- Signature: `leave(target?: HTMLElement | HTMLElement[]): Promise<void>`
- Returns `Promise<void>`

Trigger the leave transition. Pass a target to transition something other than the `target` getter's value.

### `toggle`

- Signature: `toggle(target?: HTMLElement | HTMLElement[]): Promise<void>`
- Returns `Promise<void>`

Toggle between enter and leave transitions. If the component is currently leaving (or has never transitioned), it will enter. If it's currently entering, it will leave.

```js
const transition = new Transition(el);

await transition.toggle(); // Triggers enter
await transition.toggle(); // Triggers leave
await transition.toggle(); // Triggers enter again
```

## Events

### `transition-enter`

Emitted when the enter transition is triggered.

### `transition-enter-start`

Emitted at the start of the enter transition, before the transition classes are applied.

### `transition-enter-end`

Emitted when the enter transition completes.

### `transition-leave`

Emitted when the leave transition is triggered.

### `transition-leave-start`

Emitted at the start of the leave transition, before the transition classes are applied.

### `transition-leave-end`

Emitted when the leave transition completes.
