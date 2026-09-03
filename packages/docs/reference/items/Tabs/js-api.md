---
title: Tabs JS API
---

# JS API

`Tabs` implements the [WAI-ARIA Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). It pairs each `btn` ref with the `content` ref at the same position, writes the `tablist` / `tab` / `tabpanel` roles and their relationships, keeps exactly one tab in the page's tab sequence, and moves the focus with the arrow keys.

## Refs

### `list`

The element wrapping the tab buttons. It receives `role="tablist"`.

Required by the pattern. Give it an `aria-label` or an `aria-labelledby`: without one the component reports `tabs.unnamed-tablist` on the diagnostic channel. Set `aria-orientation="vertical"` on it to move the keyboard navigation onto the up and down arrows.

### `btn[]`

The tab buttons. Each one receives `role="tab"`, an `aria-controls` pointing at its panel, an `aria-selected` and a roving `tabindex`. Use native `<button>` elements: `Enter` and `Space` activation is the platform's, not this component's.

### `content[]`

The tab panels. Each one receives `role="tabpanel"`, an `aria-labelledby` pointing at its tab, `tabindex="0"` so its content stays reachable, and the `hidden` property when it is not the selected panel.

The button and the panel at the same position are one tab, so both collections must be in matching order.

## Options

### `activation`

- Type: `'automatic' | 'manual'`
- Default: `'automatic'`

When a tab becomes the selected one. `automatic` selects a tab as soon as the arrow keys move the focus onto it. `manual` moves the focus only, and waits for a click, an `Enter` or a `Space`.

Automatic is the default because every panel is already in the markup. Use `manual` for a panel that loads its content on demand — one holding a [`Defer`](/reference/items/Defer/) or a [`Fetch`](/reference/items/Fetch/) — so moving the focus does not start a request the user did not ask for.

```html
<div data-component="Tabs" data-option-activation="manual">…</div>
```

## Which tab starts selected

The first `btn` ref carrying `aria-selected="true"`, or the first one. This is a convention rather than an option: the markup already has to say which tab is selected for the server-rendered page to be correct before the component mounts.

## Styling and animating

The component sets no inline style. Two states are available to CSS:

```css
[role='tab'][aria-selected='true'] {
  border-bottom-color: currentcolor;
}
```

Panels are hidden with the `hidden` property, which removes them from the layout, the accessibility tree and the tab order in one step.

To animate a panel, nest a [`Transition`](/reference/items/Transition/) or a [`ViewTransition`](/reference/items/ViewTransition/) inside it. `Tabs` enters the transitions of the panel that opens and leaves those of the panel that closes, and only hides the closing panel once its transitions have resolved.

```html
<div data-ref="content[]" hidden>
  <div
    data-component="Transition"
    data-option-enter="transition duration-500"
    data-option-enter-from="opacity-0"
    data-option-enter-to="opacity-100"
    data-option-leave="transition duration-500"
    data-option-leave-to="opacity-0">
    …
  </div>
</div>
```

## Methods

### `goTo(index)`

- Parameters: `index` (number) — wrapped into `0…length - 1`
- Returns: `Promise<void>`

Select a tab. Resolves once the leaving and entering transitions are done.

### `goNext()` / `goPrev()`

- Returns: `Promise<void>`

Select the next or previous tab, wrapping at both ends.

### `focusTab(index)`

- Parameters: `index` (number)
- Returns: `void`

Move the focus onto a tab, selecting it too under automatic activation. This is what the arrow keys call.

## Properties

### `currentIndex`

- Type: `number`

The index of the selected tab.

### `length`

- Type: `number`

The number of tabs, which is the number of `btn` refs.

### `orientation`

- Type: `'horizontal' | 'vertical'`

Read from the `aria-orientation` attribute of the `list` ref. It decides which pair of arrow keys moves the focus.

## Events

Both bubble. The payload is a [`TabsEventPayload`](#tabseventpayload).

### `tabs-enable`

Emitted when a tab becomes the selected one, before its panel's transitions run.

### `tabs-disable`

Emitted when a tab stops being the selected one, before its panel's transitions run.

## Keyboard interaction

| Key                                 | Action                                                           |
| ----------------------------------- | ---------------------------------------------------------------- |
| <kbd>→</kbd> / <kbd>←</kbd>         | Move the focus to the next / previous tab, wrapping (horizontal) |
| <kbd>↓</kbd> / <kbd>↑</kbd>         | The same, when the list is `aria-orientation="vertical"`         |
| <kbd>Home</kbd> / <kbd>End</kbd>    | Move the focus to the first / last tab                           |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Select the focused tab                                           |
| <kbd>Tab</kbd>                      | Leave the tab list for the selected panel                        |

## Types

### `TabsEventPayload`

```ts
interface TabsEventPayload {
  index: number;
  btn: HTMLElement;
  content: HTMLElement;
}
```

### `TabsActivation` and `TABS_ACTIVATIONS`

```ts
const TABS_ACTIVATIONS = { AUTOMATIC: 'automatic', MANUAL: 'manual' };
type TabsActivation = 'automatic' | 'manual';
```

## Diagnostics

| Code                     | Reported when                                                 |
| ------------------------ | ------------------------------------------------------------- |
| `tabs.missing-list-ref`  | No `list` ref, so nothing carries `role="tablist"`            |
| `tabs.unnamed-tablist`   | The `list` ref has neither `aria-label` nor `aria-labelledby` |
| `tabs.unpaired-refs`     | The `btn` and `content` collections have different lengths    |
| `tabs.transition-failed` | A nested transition rejected while the panel was changing     |
