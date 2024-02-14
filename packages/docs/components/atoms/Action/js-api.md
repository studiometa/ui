---
title: Action JS API
---

# JS API

The `Action` component extends the [`Base` class](https://js-toolkit.studiometa.dev/api/configuration.html). It inherits it respective API, so make sure to take a look at it.

## Options

### `on`

- Type: `string`
- Default: `'click'`

Use this option to change the listened event.

### `target`

- Type: `string`
- Required

Use this option to set the name of the components that you want to target. You can target multiple components if you separate the names by a space.

### `method`

- Type: `string`
- Required

Use this option to set the method name that will be triggered on the targeted components.

### `selector`

- Type: `string`
- Default: `null`

Use this option to filter the targeted components.
