---
title: Tabs Twig API
---

# Twig API

## Parameters

### `items`

- Type: `array<{ title: string, content: string, btn_attr?: array, content_attr?: array }>`

Array of tab items to display. Each item should contain:

- `title` - The tab button label
- `content` - The tab panel content
- `btn_attr` (optional) - Custom attributes for the tab button
- `content_attr` (optional) - Custom attributes for the tab content panel

### `attr`

- Type: `array`

Customize the root element attributes.

### `btn_attr`

- Type: `array`

Default attributes applied to all tab buttons. Individual item `btn_attr` will be merged with these.

### `content_attr`

- Type: `array`

Default attributes applied to all tab content panels. Individual item `content_attr` will be merged with these.

## Blocks

### `title_wrapper`

Customize the wrapper around all tab buttons. By default, renders all tab buttons in sequence.

### `title`

Customize each tab button's content. Defaults to `item.title`. Available variables:
- `item` - The current tab item

### `content_wrapper`

Customize the wrapper around all tab content panels. By default, renders all content panels in sequence.

### `content`

Customize each tab content panel. Defaults to `item.content`. Available variables:
- `item` - The current tab item
