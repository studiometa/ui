---
title: Transition JS API
outline: deep
---

# JS API

## Options

### `enterFrom`

- Type: `String`
- Default: `''`

Defines the classes that describe the initial state of the enter transition.

```html {2}
<div data-component="Transition"
  data-option-enter-from="opacity-0">
  ...
</div>
```

### `enterActive`

- Type: `String`
- Default: `''`

Defines the classes that describe the transitioning state of the enter transition.

```html {2}
<div data-component="Transition"
  data-option-enter-active="transition duration-500">
  ...
</div>
```

### `enterTo`

- Type: `String`
- Default: `''`

Defines the classes that describe the end state of the enter transition.

```html {2}
<div data-component="Transition"
  data-option-enter-to="opacity-90">
  ...
</div>
```

### `enterKeep`

- Type: `Boolean`
- Default: `false`

Configure wether or not the `enterTo` classes should be kept on the target element at the end of the enter transition.

```html {2}
<div data-component="Transition"
  data-option-enter-keep>
  ...
</div>
```

### `leaveFrom`

- Type: `String`
- Default: `''`

Defines the classes that describe the initial state of the leave transition.

```html {2}
<div data-component="Transition"
  data-option-leave-from="opacity-0">
  ...
</div>
```

### `leaveActive`

- Type: `String`
- Default: `''`

Defines the classes that describe the transitioning state of the leave transition.

```html {2}
<div data-component="Transition"
  data-option-leave-active="transition duration-500">
  ...
</div>
```

### `leaveTo`

- Type: `String`
- Default: `''`

Defines the classes that describe the end state of the leave transition.

```html {2}
<div data-component="Transition"
  data-option-leave-to="opacity-90">
  ...
</div>
```

### `leaveKeep`

- Type: `Boolean`
- Default: `false`

Configure wether or not the `leaveTo` classes should be kept on the target element at the end of the leave transition.

```html {2}
<div data-component="Transition"
  data-option-leave-keep>
  ...
</div>
```


### `group`

- Type: `String`
- Default: `''`

Define a group to sync `enter` and `leave` transition between multiple instances.

```html {2,7}
<div data-component="Transition"
  data-option-group="my-group">
  ...
</div>

<div data-component="Transition"
  data-option-group="my-group">
  ...
</div>
```


## Properties

### `target`

- Type: `HTMLElement`

A getter returning the target element for the transition. Defaults to the components root element `this.$el`.

### `state`

- Type: `'entering' | 'leaving' | null`
- Default: `null`

The current state of the transition. Will be `'entering'` when an enter transition is in progress, `'leaving'` when a leave transition is in progress, or `null` when no transition is active.

## Methods

### `enter`

- Returns `Promise<void>`

Trigger the enter transition.

### `leave`

- Returns `Promise<void>`

Trigger the leave transition.

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

### `transition-toggle`

Emitted when the toggle method is called.

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
