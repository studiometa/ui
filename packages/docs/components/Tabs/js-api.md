---
title: Tabs JS API
---

# JS API

## Refs

### `btn[]`

HTMLElement references for tab button elements. Each button corresponds to a tab content panel.

### `content[]`

HTMLElement references for tab content panels. Each panel corresponds to a tab button.

## Options

### `styles`

- Type: `object`
- Default: `{ content: { closed: { position: 'absolute', opacity: '0', pointerEvents: 'none', visibility: 'hidden' } } }`

Configure the styles for different tab states. Available references are `btn` and `content`, each supporting `open`, `active`, and `closed` style states.

```html
data-option-styles='{
  "btn": {
    "open": {"borderBottomColor": "#fff"},
    "closed": {"borderBottomColor": "transparent"}
  },
  "content": {
    "open": {"opacity": 1},
    "closed": {"opacity": 0}
  }
}'
```

## Methods

### `enableItem(item)`

- Parameters: `item` (TabItem) - The tab item to enable
- Returns: `Promise<this>`

Enable a specific tab item and its associated content with transition animations.

### `disableItem(item)`

- Parameters: `item` (TabItem) - The tab item to disable
- Returns: `Promise<this>`

Disable a specific tab item and its associated content with transition animations.

## Events

### `enable`

Emitted when a tab is enabled. The event data contains the enabled tab item.

### `disable`

Emitted when a tab is disabled. The event data contains the disabled tab item.

## Properties

### `items`

- Type: `TabItem[]`

Array of tab items, each containing:
- `btn` (HTMLElement) - The tab button element
- `content` (HTMLElement) - The tab content element
- `isEnabled` (boolean) - Whether the tab is currently enabled

## Event Handlers

### `onBtnClick({ index })`

Internal method called when a tab button is clicked. Switches to the clicked tab and disables others.
