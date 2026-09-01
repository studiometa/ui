---
title: Tabs Twig API
---

# Twig API

## Parameters

### `items`

- Type: `array<{ title: string, content: string, selected?: bool, btn_attr?: array, content_attr?: array }>`

Array of tab items to display. Each item should contain:

- `title` - The tab button label
- `content` - The tab panel content
- `selected` (optional) - Marks the tab that starts open. The first item otherwise.
- `btn_attr` (optional) - Custom attributes for the tab button
- `content_attr` (optional) - Custom attributes for the tab content panel

### `label`

- Type: `string`

Accessible name for the tab list, written as `aria-label` on the `tablist` element. Required by the pattern: the component reports `tabs.unnamed-tablist` when the list has neither `aria-label` nor `aria-labelledby`.

### `id`

- Type: `string`

Prefix for the generated tab and panel IDs, which is what `aria-controls` and `aria-labelledby` point at. Optional: the component generates them at runtime when the markup has none. Pass one when the relationships have to exist before the JavaScript runs.

### `attr`

- Type: `array`

Customizes the root element attributes.

### `list_attr`

- Type: `array`

Customizes the tab list element. Put the list's layout classes here rather than wrapping the buttons in another element. Set `aria_orientation: 'vertical'` to move the keyboard navigation onto the up and down arrows.

### `btn_attr`

- Type: `array`

Default attributes applied to all tab buttons. Individual item `btn_attr` is merged with these.

### `content_attr`

- Type: `array`

Default attributes applied to all tab content panels. Individual item `content_attr` is merged with these.

## Blocks

### `title_wrapper`

Customizes how the tab buttons are rendered inside the tab list. By default, renders all tab buttons in sequence. The `role="tablist"` element is outside this block, so overriding it cannot lose the role.

### `title`

Customizes each tab button's content. Defaults to `item.title`. Available variables:

- `item` - The current tab item

### `content_wrapper`

Customizes the wrapper around all tab content panels. By default, renders all content panels in sequence.

### `content`

Customizes each tab content panel. Defaults to `item.content`. Available variables:

- `item` - The current tab item
