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


## Properties

### `target`

- Type: `HTMLElement`

A getter returning the target element for the transition. Defaults to the components root element `this.$el`.

## Methods

### `enter`

- Returns `Promise<void>`

Trigger the enter transition.

### `leave`

- Returns `Promise<void>`

Trigger the leave transition.
