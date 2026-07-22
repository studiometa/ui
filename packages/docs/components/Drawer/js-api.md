---
title: Drawer JS API
outline: deep
---

# JS API

The `Drawer` extends [`Dialog`](/components/Dialog/js-api), so it inherits all of its options (`modal`, `trapFocus`, `scrollLock`), methods (`open`, `close`, `toggle`), properties (`dialog`, `transitions`) and events (`open`, `close`). Only the additions are documented here.

## Options

### `position`

- Type: `String`
- Default: `'right'`
- Values: `'top' | 'right' | 'bottom' | 'left'`

The edge the panel slides in from. It selects the Tailwind translate class injected into the panel's hidden-state transition options and initial class — nothing else. There is no geometry computation.

<!-- prettier-ignore-start -->
```html {2}
<dialog data-component="Action Drawer"
  data-option-position="left">
  ...
  <div data-component="ViewTransition" data-drawer-panel>...</div>
</dialog>
```
<!-- prettier-ignore-end -->

## Properties

### `slideClass`

- Type: `string`

A getter returning the translate class for the current `position`:

| `position` | `slideClass`         |
| ---------- | -------------------- |
| `top`      | `-translate-y-full`  |
| `right`    | `translate-x-full`   |
| `bottom`   | `translate-y-full`   |
| `left`     | `-translate-x-full`  |

### `panels`

- Type: `Array<Transition | ViewTransition>`

A getter returning the transition children flagged with `data-drawer-panel` — the ones that receive the slide class.

## Static properties

### `Drawer.slideClasses`

- Type: `Record<'top' | 'right' | 'bottom' | 'left', string>`

The position-to-class map used by the `slideClass` getter. Override it on a subclass to change the slide classes (for example, to swap `translate-x-full` for a `clip-path` or `right` animation).
