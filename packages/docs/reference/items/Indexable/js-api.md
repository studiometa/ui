---
title: Indexable JS API
outline: deep
---

# JS API

## Options

### `boundary`

- Type: `string`
- Default: `'clamp'`

Three boundary behaviors are available: `clamp`, `loop`, or `bounce`:

- **`clamp`**: stops at `minIndex` and at `maxIndex`.
- **`loop`**: wraps from `maxIndex` back to `minIndex`, and from `minIndex` back to `maxIndex`.
- **`bounce`**: reverses the travel direction at either bound and continues the other way.

An unrecognized value falls back to `clamp`.

<!-- prettier-ignore-start -->
```html {2}
<div
  data-component="Indexable"
  data-option-boundary="loop">
  ...
</div>
```
<!-- prettier-ignore-end -->

### `reverse`

- Type: `boolean`
- Default: `false`

Defines the initial direction of the count.

<!-- prettier-ignore-start -->
```html {2}
<div
  data-component="Indexable"
  data-option-reverse>
  ...
</div>
```
<!-- prettier-ignore-end -->

### `total`

- Type: `number`
- Default: `0`

Defines the number of items to navigate through. It sets the `length` property, allowing the `Indexable` component to be used standalone without extending it. Subclasses may override the `length` getter to derive it from their content instead.

<!-- prettier-ignore-start -->
```html {2}
<div
  data-component="Indexable"
  data-option-total="3">
  ...
</div>
```
<!-- prettier-ignore-end -->

## Methods

### `goTo(indexOrInstruction)`

- Parameters: `number | 'next' | 'previous' | 'first' | 'last' | 'random'`
- Returns: `Promise<void>`

Navigates to an index, or resolves one of five instructions. `first` and `last` respect `isReverse`; `random` picks between `minIndex` and `maxIndex`. An unknown instruction reports an `indexable.invalid-instruction` warning and a non-finite number an `indexable.invalid-index` warning; both resolve without moving.

### `goNext()` and `goPrev()`

- Returns: `Promise<void>`

One step along, or against, the current `direction`.

### `step(direction)`

- Parameters: `direction` (`number`)
- Returns: `Promise<void>`

Moves by an arbitrary signed amount. Under `bounce`, a step that would cross a bound flips `isReverse` and folds back into range.

### `normalizeIndex(value)`

- Parameters: `value` (`number`)
- Returns: `number`

Brings any value into `minIndex…maxIndex` following the current boundary.

## Events

### `index`

Emitted when the current index changes, and only then — assigning the index it already holds emits nothing. The `detail` carries `index` (`number`), the new normalized index.

The event bubbles, so it can be caught from an ancestor or wired declaratively:

```html
<span
  data-component="Indexable Action"
  data-option-total="4"
  data-on:index="DataBind -> target.set(event.detail.index, false)"></span>
```

Inside a subclass, an `onIndex()` method receives it directly.

## Exports

```js
import { Indexable, INDEXABLE_BOUNDARIES, INDEXABLE_INSTRUCTIONS } from '@studiometa/ui';

INDEXABLE_BOUNDARIES; // { CLAMP: 'clamp', LOOP: 'loop', BOUNCE: 'bounce' }
INDEXABLE_INSTRUCTIONS; // { NEXT: 'next', PREVIOUS: 'previous', FIRST: 'first', LAST: 'last', RANDOM: 'random' }
```

Both are frozen objects; use them instead of string literals when you want the compiler to check the value. The matching types are `IndexableBoundary` and `IndexableInstruction`, and `IndexableProps` types the component's options and events.

::: tip Coming from v1
[`withIndex(Base)`](/reference/items/withIndex/) is still there, and it is where this behaviour lives: `Indexable` is `withIndex(Base)` and the component name, nothing more. Extend the class when your component extends nothing else, mix the decorator in when it already does.
:::
