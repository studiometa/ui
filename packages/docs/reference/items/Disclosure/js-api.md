---
title: Disclosure JS API
outline: deep
---

# JS API

## Registration

Register `Disclosure` independently even when it is inside a group. Register `DisclosureGroup` only when group constraints are needed.

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Disclosure, DisclosureGroup } from '@studiometa/ui';

registerComponents(Disclosure, DisclosureGroup);
```

## `Disclosure`

### Refs

#### `trigger`

- Type: `HTMLButtonElement`

The native button controlling the panel.

#### `panel`

- Type: `HTMLElement`

The disclosed panel.

### Options

#### `open`

- Type: `boolean`
- Default: `false`

Defines the initial open state. Initialization updates `aria-expanded` and `hidden` without transitions or lifecycle events.

```html
<section data-component="Disclosure" data-option-open>...</section>
```

#### `disabled`

- Type: `boolean`
- Default: `false`

Disables interaction and the native trigger. Calls to `open()` and `close()` resolve without changing state while disabled.

```html
<section data-component="Disclosure" data-option-disabled>...</section>
```

### Properties

#### `isOpen`

- Type: `boolean`

The current open state.

#### `group`

- Type: `DisclosureGroup | undefined`

The closest group with which the disclosure is registered, or `undefined` when it works standalone.

#### `index`

- Type: `number`

The disclosure's current DOM-order index in its group, or `-1` outside a group.

#### `disabled`

- Type: `boolean`

Whether interaction is disabled by the disclosure's `disabled` option.

#### `transitions`

- Type: `Array<Transition | ViewTransition>`

Transition children owned by this disclosure. Transitions whose closest disclosure is nested inside this one are excluded.

### Methods

#### `open()`

- Returns: `Promise<void>`

Opens the disclosure, delegating group constraints to its group when present.

#### `close()`

- Returns: `Promise<void>`

Closes the disclosure when allowed. Focus inside the panel is moved back to the trigger before the panel is hidden.

#### `toggle()`

- Returns: `Promise<void>`

Opens a closed disclosure or closes an open disclosure.

#### `enable()`

Enables interaction and synchronizes the native button's `disabled` state.

#### `disable()`

Disables interaction and synchronizes the native button's `disabled` state. It does not close an already open disclosure.

### Events

#### `disclosure-open`

Emitted immediately after open state is committed, with the `Disclosure` instance as payload.

#### `disclosure-close`

Emitted immediately after close state is committed, with the `Disclosure` instance as payload.

#### `disclosure-after-open`

Emitted with the `Disclosure` instance after all owned enter transitions finish and only if the disclosure is still open.

#### `disclosure-after-close`

Emitted with the `Disclosure` instance after all owned leave transitions finish, the panel is hidden, and only if the disclosure is still closed.

### Transition serialization

Opening and closing state is committed synchronously, but transition work is queued. Opposing operations never interrupt a still-pending toolkit transition promise. Stale completions do not hide a panel or emit a `disclosure-after-*` event for a state that has since changed. Errors from transition children are warned and do not reject the disclosure operation.

## `DisclosureGroup`

### Options

#### `multiple`

- Type: `boolean`
- Default: `true`

Allows several disclosures to remain open. Set it to false with `data-option-no-multiple` for single-open behavior. If several items are initially open in single-open mode, only the first open item in DOM order remains open.

#### `collapsible`

- Type: `boolean`
- Default: `true`

Allows the open item to close in single-open mode. Set it to false with `data-option-no-collapsible` to prevent the sole open item from closing. If none starts open, the first enabled item opens during initialization. The locked open trigger receives `aria-disabled="true"`. This constraint applies to single-open mode; `multiple=true` remains freely collapsible.

| `multiple` | `collapsible`     | Behavior                                                                                        |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `true`     | `true` or `false` | Any number of items can open and close.                                                         |
| `false`    | `true`            | At most one item is open, and all items can be closed.                                          |
| `false`    | `false`           | The sole open item cannot close; initialization opens the first enabled item when none is open. |

### Properties

#### `items`

- Type: `Disclosure[]`

Registered disclosures belonging to this closest group, in current DOM order.

#### `openItems`

- Type: `Disclosure[]`

Currently open registered disclosures in DOM order.

### Methods

#### `register(disclosure)`

Registers a disclosure when this is its closest mounted group. Registration is idempotent and normally happens automatically.

#### `unregister(disclosure)`

Removes a disclosure from the group. This normally happens automatically during destruction or reconnection.

#### `open(itemOrIndex)`

- Parameters: `Disclosure | number`
- Returns: `Promise<void>`

Opens a registered enabled disclosure. In single-open mode, other open items are closed.

#### `close(itemOrIndex)`

- Parameters: `Disclosure | number`
- Returns: `Promise<void>`

Closes a registered enabled disclosure unless it is the one item locked open by non-collapsible single-open mode.

#### `toggle(itemOrIndex)`

- Parameters: `Disclosure | number`
- Returns: `Promise<void>`

Toggles a registered disclosure while respecting group constraints.

#### `openAll()`

- Returns: `Promise<void>`

Opens every enabled disclosure when `multiple` is true. It does nothing in single-open mode.

#### `closeAll()`

- Returns: `Promise<void>`

Closes every enabled open disclosure unless the group is both single-open and non-collapsible.

Unknown indexes, foreign disclosures, and disabled target disclosures are ignored.

### Events

#### `disclosure-group-open`

Relays an item opening with the `Disclosure` instance and its DOM-order index.

#### `disclosure-group-close`

Relays an item closing with the `Disclosure` instance and its DOM-order index.

#### `disclosure-group-change`

Emitted after an item state change with the current `openItems` array.
