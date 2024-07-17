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

### `name`

- Type: `string`
- Default: `''`

## Properties

### `value`

Get and set the value on the current instance. This is a getter and setter alias for the [`set(value)`](#set-value-string-boolean-string) and [get()](#get) methods.

## Methods

### `set(value: string | boolean | string[])`

Set the value for the current instance.

### `get()`

Get the value for the current instance.
