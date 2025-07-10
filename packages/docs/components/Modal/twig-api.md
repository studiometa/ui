---
title: Modal Twig API
---

# Twig API

## Parameters

### `attr`

- Type: `array`

Customize the root element attributes.

### `modal_attr`

- Type: `array`

Customize the modal element attributes. The modal element is the main container that covers the full viewport.

### `overlay_attr`

- Type: `array`

Customize the overlay background element attributes. The overlay provides the semi-transparent background behind the modal content.

### `wrapper_attr`

- Type: `array`

Customize the wrapper element attributes. The wrapper centers the modal content within the viewport.

### `container_attr`

- Type: `array`

Customize the container element attributes. The container holds the actual modal content and handles scrolling.

### `content_attr`

- Type: `array`

Customize the content element attributes. The content element wraps the modal's inner content.

## Blocks

### `open`

Customize the open trigger button. By default, renders a Button component with `data-ref="open[]"` and label "Open".

### `close`

Customize the close trigger button. By default, renders a Button component positioned absolutely in the top-right corner with `data-ref="close[]"` and label "Close".

### `content`

Set the modal's content. This is where you place the main content of your modal dialog.
