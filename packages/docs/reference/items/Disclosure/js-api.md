---
title: Disclosure JS API
outline: deep
---

# JS API

## Registration

No `@studiometa/ui` component registers itself: importing a module only defines the class. `DisclosureGroup` declares `Disclosure` as a family member, and `Disclosure` declares `Transition` and `ViewTransition`, so one call registers all four.

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { DisclosureGroup } from '@studiometa/ui';

registerComponent(DisclosureGroup);
```

Register `Disclosure` on its own when you want disclosures without any group coordination.

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

The closest group that claimed this disclosure, or `undefined` when it works standalone.

#### `index`

- Type: `number`

The disclosure's current DOM-order index in its group, or `-1` outside a group.

#### `disabled`

- Type: `boolean`

Whether interaction is disabled by the disclosure's `disabled` option.

#### `transitions`

- Type: `Transitionable[]` — the `Transition` and `ViewTransition` children

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

Enables interaction: removes `data-option-disabled` from the root element and synchronizes the native button's `disabled` state. Because `$options` is a read-only view over the attributes, the pair writes the attribute the option reads, so the change is visible on the very next `$options.disabled` read.

#### `disable()`

Disables interaction: sets `data-option-disabled` on the root element and synchronizes the native button's `disabled` state. It does not close an already open disclosure.

::: warning Responsive overrides still win
`enable()` and `disable()` write the presence-only attribute. A responsive `data-option-disabled:<breakpoint>` declared in the markup still outranks it at that breakpoint.
:::

### Events

None of the four carries a `detail`: the emitting `Disclosure` is the event target, which is all a listener needs.

#### `disclosure-open`

Emitted immediately after the open state is committed, before the enter transitions run.

#### `disclosure-close`

Emitted immediately after the close state is committed, before the leave transitions run.

#### `disclosure-after-open`

Emitted after all owned enter transitions finish, and only if the disclosure is still open.

#### `disclosure-after-close`

Emitted after all owned leave transitions finish and the panel is hidden, and only if the disclosure is still closed.

All four bubble, so a listener on an ancestor — a `DisclosureGroup` included — hears them. That is why they are namespaced `disclosure-*` and the group's own events are namespaced `disclosure-group-*`.

### Transition serialization

Opening and closing state is committed synchronously, but transition work is queued. Opposing operations never interrupt a still-pending toolkit transition promise. Stale completions do not hide a panel or emit a `disclosure-after-*` event for a state that has since changed. Errors from transition children are reported as a `disclosure.transition-failed` error diagnostic and do not reject the disclosure operation.

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

The claimed disclosures that are currently open, in DOM order.

Membership is not a public API. The group holds a live `$watchChildren()` collection of every mounted `Disclosure` in its subtree and claims each one; a disclosure already claimed by a nearer group refuses the claim, so a nested group always wins. There is nothing to register or unregister by hand.

### Methods

#### `open(itemOrIndex)`

- Parameters: `Disclosure | number`
- Returns: `Promise<void>`

Opens a claimed, enabled disclosure. In single-open mode, other open items are closed.

#### `close(itemOrIndex)`

- Parameters: `Disclosure | number`
- Returns: `Promise<void>`

Closes a claimed, enabled disclosure unless it is the one item locked open by non-collapsible single-open mode.

#### `toggle(itemOrIndex)`

- Parameters: `Disclosure | number`
- Returns: `Promise<void>`

Toggles a claimed disclosure while respecting group constraints.

#### `openAll()`

- Returns: `Promise<void>`

Opens every enabled disclosure when `multiple` is true. It does nothing in single-open mode.

#### `closeAll()`

- Returns: `Promise<void>`

Closes every enabled open disclosure unless the group is both single-open and non-collapsible.

Unknown indexes, foreign disclosures, and disabled target disclosures are ignored.

### Events

#### `disclosure-group-open`

Relays an item opening. The `detail` carries `item` (the `Disclosure`) and `index` (its DOM-order position in the group).

#### `disclosure-group-close`

Relays an item closing. The `detail` carries `item` (the `Disclosure`) and `index` (its DOM-order position in the group).

#### `disclosure-group-change`

Emitted after an item state change. The `detail` carries `items`, the current `openItems` array.
