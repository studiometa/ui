---
title: DataBind JavaScript API
outline: deep
---

# DataBind JS API

The `DataBind` component can be used to keep a value in sync between multiple DOM elements.

## Options

### `prop`

- Type: `string`
- Default: `'textContent'`

The default value for the `prop` options depends on the type of the targeted element. If the element is an input, a textearea or a select, the default prop will be one of the following:

- `valueAsDate` for `<input type="date">`
- `valueAsNumber` from `<input type="number">`
- `value` for all other inputs
- for `<select>` elements, the prop option is not used and the value will always be the selected option(s)

If the option is explicitly set with the `data-option-prop` attribute, it will override the default behavior.

### `group`

- Type: `string`
- Default: `''`

The `group` option is used to group instances together. All related instances will be updated when the value changes.

When using it with multiple checkboxes or select multiple, use the `[]` suffix to push each selected value in an array. See the [checkboxes example](/components/DataBind/examples.html#checkboxes) for more details on how this works.

## Properties

### `value`

Get and set the value on the current instance. This is a getter and setter alias for the [`set(value)`](#set-value-string-boolean-string) and [get()](#get) methods.

### `target`

- Type: `HTMLElement`
- Readonly

The targeted DOM element.

### `multiple`

- Type: `boolean`
- Readonly

Wether new values should be pushed to an array instead of a single value. This is enabled by adding the `[]` suffix to the [`group` option](#group).

## Methods

### `set(value: string | boolean | string[], dispatch = true)`

Set the value for the current instance and dispatch it to others if the second parameter `dispatch` is set to `true` (default).

**Params**

- `value` (`string | boolean | string[]`): the value to set
- `dispatch` (`boolean`, default to `true`): wether to dispatch the value to other related instances or not

### `get()`

Get the value for the current instance.
