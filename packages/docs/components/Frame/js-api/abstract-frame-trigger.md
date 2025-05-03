---
title: AbstractFrameTrigger
---

# AbstractFrameTrigger

## Options

### `requestInit`

- Type: `RequestInit`
- Default: `{}`

Use this option to customize the options for the fetch request.

### `headers`

- Type: `Record<string, string>`
- Default: `{}`

Use this option to add custom headers to the fetch request. The headers will be merge with any `$options.requestInit.headers` already defined.

## Getters

### `url`

- Return: `URL`
- Default: `this.$el.href` or `this.$el.action` depending on the type of the root element

### `requestInit`

- Return: `RequestInit`
- Default: the `requestInit` and `headers` options merged

## Methods

### `trigger`

- Return: `Promise<void>`

This method will be called by components extending the `AbstractFrameTrigger` to notify its parent `Frame` to fetch content.

## Emits

### `frame-trigger`

- Parameters:
  - `url` (`URL`): the value returned by the `url` getter
  - `requestInit` (`RequestInit`): the value returned by the `requestInit` getter

This event is emitted from the [`trigger` method](#trigger).
