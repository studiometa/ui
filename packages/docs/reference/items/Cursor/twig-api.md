---
title: Cursor Twig API
---

# Twig API

The template renders the root element, writes the [`states`](/reference/items/Cursor/js-api#states) map onto it and ships a default stylesheet for the black dot. Every rule in it is wrapped in `:where()`, so it has zero specificity and any declaration of yours wins without `!important`.

## Parameters

### `states`

- Type: `array`
- Default: `{ 'a, button, [data-cursor-grow]': 'grow', '[data-cursor-shrink]': 'shrink' }`

Map of CSS selector to state name, published as [`data-cursor-state`](/reference/items/Cursor/js-api#data-cursor-state).

```twig
{% include '@ui/Cursor/Cursor.twig' with {
  states: { 'a, button': 'grow', '.is-media': 'zoom' }
} only %}
```

The default map is what the shipped stylesheet styles. A map of your own replaces it entirely, so style the names you choose.

### `damping`

- Type: `number`
- Default: the component's own `0.25`

How fast the cursor catches up with the pointer, between `0` and `1`.

### `attr`

- Type: `array`

Custom attributes for the root element.

## Blocks

### `content`

Custom content for the root element. Defaults to `''`.
