---
title: FrameTarget
---

# FrameTarget

The `FrameLoader` component extends the [`Transition` component](/components/Transition/) and inherits its APIs, with the exception of the [`enterKeep`](/components/Transition/js-api.md#enterkeep) and [`leaveKeep`](/components/Transition/js-api.md#/components/Transition/js-api.md#enterkeep) options which are force to be always `true`.

## Options

### `mode`

- Type: `'replace' | 'append' | 'prepend'`
- Default: `'replace'`

Use this option to define how new content should be inserted in the actual DOM: `replace` (the default), `append` or `prepend`.

When using the `replace` mode, transitions defined by the [`Transition` component API](/components/Transition/) will be played sequencially:

- the leave transition is applied to the root element
- new content replaces the old content
- the enter transition is applied to the root element

When using any of the `append` or `prepend` mode, transitions are played in parallel:

- the leave transition is applied on the existing children of the root element
- the enter transition is applied on the new children added to the root element

::: info DOM diffing

When in `replace` mode, the [`morphdom` package](https://github.com/patrick-steele-idem/morphdom) is used to smartly update the content of the component. This prevents losing any existing state that might not need to be erased: focus, event listeners, mounted components, etc..

:::

## Getters

### `id`

- Return: `string`
- Default: `this.$el.id`
