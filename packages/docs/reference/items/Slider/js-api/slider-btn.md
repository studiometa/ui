# SliderBtn

Previous or next control. The root element must be a native `<button>`: the component toggles its `disabled` attribute at the first and last slide.

## Options

### `prev`

- Type: `boolean`
- Default: `false`

Goes to the previous slider item on click, and disables the button when the slider is on the first item.

### `next`

- Type: `boolean`
- Default: `false`

Goes to the next slider item on click, and disables the button when the slider is on the last item.

## Methods

### `update(index, total)`

- Parameters: `index` (`number`), `total` (`number`)
- Returns: `void`

Recomputes the disabled state. It is called for you on every slider state change.

## Requirements

The button resolves its slider through the `SliderContext`, so it does not have to be a direct child — only a descendant. Outside a `Slider` it never updates and its clicks do nothing.
