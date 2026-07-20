---
title: DataBind JavaScript API
outline: deep
---

# JS API

The `DataBind` component can be used to keep a value in sync between multiple DOM elements.

## Options

### `prop`

- Type: `string`
- Default: `'textContent'`

The default value for the `prop` option depends on the type of the targeted element. If the element is an input, a textarea, or a select, the default prop will be one of the following:

- `valueAsDate` for `<input type="date">`
- `valueAsNumber` for `<input type="number">`
- `value` for all other inputs
- for `<select>` elements, the prop option is not used and the value will always be the selected option(s)

If the option is explicitly set with the `data-option-prop` attribute, it will override the default behavior.

### `immediate`

- Type: `boolean`
- Default: `false`

Propagates the component's value on mount to other components in the same group. Inside a [`DataScope`](../DataScope/index.md), only [`DataModel`](../DataModel/index.md) sources hydrate the keyed value; immediate keyed `DataBind`, `DataComputed` and `DataEffect` components are subscribers and receive the hydrated values once all sources are collected.

### `group`

- Type: `string`
- Default: `''`

The `group` option is used to group instances together. All related instances will be updated when the value changes. Inside a [`DataScope`](../DataScope/index.md), an omitted group inherits the scope's group and remains isolated from other scopes.

### `key`

- Type: `string`
- Default: the native form control `name`, when scoped

A keyed value updates only bindings with the same key while notifying unkeyed subscribers. Keys are local to a `DataScope`; unscoped bindings preserve scalar group behavior.

When using it with multiple checkboxes or a multiple select, use the `[]` suffix to push each selected value into an array. See the [checkboxes example](../DataModel/examples.md#checkboxes) for more details.

## Virtual bindings

Virtual `data-bind:*` attributes update several parts of an element from the same value. When an element has one or more virtual bindings, they replace the default single `textContent` or property update.

| Syntax                   | Behavior                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `data-bind:prop.<name>`  | Assigns the DOM property.                                                                                                                |
| `data-bind:attr.<name>`  | Removes the attribute for `false`, `null`, or `undefined`; writes an empty attribute for `true`; otherwise writes the stringified value. |
| `data-bind:class.<name>` | Toggles the class according to the result's boolean value.                                                                               |
| `data-bind:style.<name>` | Clears the style for `false`, `null`, or `undefined`; otherwise writes the stringified value.                                            |
| `data-bind:text`         | Assigns `textContent`.                                                                                                                   |

A non-empty attribute value is a JavaScript expression with access to `value`, `target`, and `$data`. An empty attribute passes through the current value. Bindings are read when first used; changing their attributes afterward is not supported.

Use kebab-case for camel-cased DOM properties because HTML attribute names are case-insensitive, for example `data-bind:prop.tab-index` targets `tabIndex`.

For ARIA attributes, explicitly stringify booleans when `"false"` must remain present, for example `data-bind:attr.aria-selected="String(value === 'overview')"`.

Expression errors are reported without interrupting updates to the other bindings, matching `DataComputed` and `DataEffect` behavior.

## Properties

### `value`

Get and set the value on the current instance. This is a getter and setter alias for the `set(value)` and [`get()`](#get) methods.

### `target`

- Type: `HTMLElement`
- Readonly

The targeted DOM element.

### `multiple`

- Type: `boolean`
- Readonly

Whether new values should be pushed to an array instead of a single value. This is enabled by adding the `[]` suffix to the [`group` option](#group).

## Methods

### `set(value: DataValue, dispatch = true)`

Set the value for the current instance and dispatch it to others if the second parameter `dispatch` is set to `true` (default).

`DataValue` accepts `boolean`, `string`, `string[]`, `number`, `Date`, `null`, or `undefined`.

**Params**

- `value` (`DataValue`): the value to set
- `dispatch` (`boolean`, defaults to `true`): whether to dispatch the value to other related instances

The mutation helpers below are available on `DataBind` and `DataModel`. They are not supported on computed values or effects.

### `toggle(onValue = true, offValue = false)`

Toggle between two values and dispatch the result to the group. Single checkboxes support the default boolean values; custom values require a target that can represent them without coercing them to `checked`. Radio inputs are not supported.

Custom values can describe disclosure state without repeating comparison logic in an Action:

```html
<div data-component="DataScope" data-option-group="disclosure">
  <button
    type="button"
    value="closed"
    data-component="Action DataModel"
    data-option-key="state"
    data-option-prop="value"
    data-option-immediate
    data-on:click="DataModel.toggle('open', 'closed')"
    data-bind:attr.aria-expanded="String(value === 'open')">
    Toggle
  </button>
</div>
```

### `increment(step = 1)`

Convert the current value to a number, increment it by `step`, and dispatch the result. A non-numeric current value starts at `0`. Pass a negative step to decrement. Date inputs are not supported.

```html
<div data-component="DataScope" data-option-group="counter">
  <button
    type="button"
    value="0"
    data-component="Action DataModel"
    data-option-key="count"
    data-option-prop="value"
    data-option-immediate
    data-on:click="DataModel.increment()"
    data-bind:text="`Count: ${value}`">
    Count: 0
  </button>
</div>
```

### `cycle(values)`

Select and dispatch the value following the current value in the given array. The method wraps to the first value; an unknown current value also selects the first value. An empty array does nothing.

```html
<div data-component="DataScope" data-option-group="workflow">
  <button
    type="button"
    value="draft"
    data-component="Action DataModel"
    data-option-key="status"
    data-option-prop="value"
    data-option-immediate
    data-on:click="DataModel.cycle(['draft', 'review', 'published'])"
    data-bind:text="`Status: ${value}`">
    Status: draft
  </button>
</div>
```

### `get()`

Get the value for the current instance.
