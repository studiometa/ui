---
title: Frame JS API
---

# JS API

## Frame
The `Frame` component extends the [`Base` class](https://js-toolkit.studiometa.dev/api/configuration.html).
It inherit it's API, so make sur have a look at it.

### Options
<br>

#### `history`

- Type: `boolean`
- Default: `false`

Use this options to update browser history when performing a request. See [historyPush](https://js-toolkit.studiometa.dev/utils/history/historyPush.html#historypush)
This option only work for GET requests.

### Emits

The component emit the following events :

- `before-fetch`
- `after-fetch`
- `before-leave`
- `after-leave`
- `before-content`
- `after-content`
- `before-enter`
- `after-enter`

---

## FrameTarget
The `FrameTarget` component extends the [`Transition` class](https://js-toolkit.studiometa.dev/utils/css/transition.html#transition).
It inherit it's API, so make sur have a look at it.

### Options
<br>

#### `id`

- Type: `string`

Use this options to specify the id of the `FrameTarget`

<br>

#### `mode`

- Type: `string`
- Default: `'replace'`
- Possible values: `'replace' | 'prepend' | 'append'`

Use this options to specify how the content inside FrameTarget will be updated after a request.

