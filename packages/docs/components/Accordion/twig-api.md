---
title: Accordion Twig API
---

# Twig API

## Parameters

### `items`

- Type: `array<{ title: string, content: unknown, attr: array }>`

List of items to display.

### `attr`

- Type: `array`

Customizes the root element attributes.

### `item_attr`

- Type: `array`

Customizes each item element attributes.

### `item_container_attr`

- Type: `array`

Customizes each item container element attributes.

## Blocks

### `title`

Customizes each item's title. Defaults to `item.title`.

### `content`

Customizes each item's content. Defaults to `item.content`.
