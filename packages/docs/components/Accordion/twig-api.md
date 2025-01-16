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

Customize the root element attributes.

### `item_attr`

- Type: `array`

Customize each item element attributes.

### `item_container_attr`

- Type: `array`

Customize each item container element attributes.

## Blocks

### `title`

Use this block to customize each item's title, defaults to `item.title`.

### `content`

Use this block to customize each item's content, defaults to `item.content`.
