---
badges: [JS]
---

# Popover <Badges :texts="$frontmatter.badges" />

::: warning Preview
The `Popover` component is a preview. Its API may change before it is marked as stable.
:::

The `Popover` component is a headless wrapper around the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API): the non-modal sibling of [`Dialog`](/reference/items/Dialog/). The platform gives a floating panel its top-layer stacking (it always paints above the page, with no `z-index` to manage) and, with `popover="auto"`, light-dismiss and <kbd>Esc</kbd>. The component owns only the orchestration of your transitions.

It ships no markup and no positioning. You author the HTML, wire the triggers with [`Action`](/reference/items/Action/), animate with [`Transition`](/reference/items/Transition/) or [`ViewTransition`](/reference/items/ViewTransition/) children and place the panel with your own CSS. A dropdown, a tooltip and a hover card are the same `Popover`: only the triggers, the ARIA attributes and the position change.

## Usage

Register the component, along with the [`Action`](/reference/items/Action/) and [`Transition`](/reference/items/Transition/) components used by the authored HTML:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Popover, Transition } from '@studiometa/ui';

registerComponent(Action);
registerComponent(Popover);
registerComponent(Transition);
```

The `Popover` lives on the `[popover]` element. Inside it sits a transition child: the visible, animated panel. Triggers live anywhere on the page and call the component through `Action`:

```html
<button
  type="button"
  id="menu-trigger"
  aria-expanded="false"
  aria-controls="menu"
  data-component="Action"
  data-on:click="Popover(#menu)->target.toggle()">
  Account
</button>

<div
  popover="manual"
  id="menu"
  data-component="Action Popover"
  data-on:open="document.getElementById('menu-trigger').setAttribute('aria-expanded', 'true')"
  data-on:close="document.getElementById('menu-trigger').setAttribute('aria-expanded', 'false')">
  <nav
    aria-label="Account"
    data-component="Transition"
    data-option-enter-active="transition duration-200 ease-out"
    data-option-enter-from="opacity-0"
    data-option-leave-active="transition duration-150 ease-in"
    data-option-leave-to="opacity-0"
    data-option-leave-keep
    class="p-2 rounded-lg bg-white shadow-xl opacity-0">
    <a href="/profile">Profile</a>
    <a href="/settings">Settings</a>
  </nav>
</div>
```

## Triggers are delegated to `Action`

The `Popover` class has no refs. It listens only to the native `toggle` event of its own element, to stay in sync with the platform. Every interaction is wired with [`Action`](/reference/items/Action/), which calls the component's methods:

- **Dropdown (click)**: `data-on:click="Popover(#id)->target.toggle()"` on the button.
- **Tooltip or hover card (hover and focus)**: `data-on:mouseenter` and `data-on:focus` call `open()`, `data-on:mouseleave` and `data-on:blur` call `close()`.
- **<kbd>Esc</kbd>**: `data-on:keydown="Popover(#id)->event.key === 'Escape' && target.close()"` on an element that holds the focus: the button, or a wrapper around the button and the popover.
- **Click outside**: a [`ClickOutside`](/reference/items/ClickOutside/) wrapper around the button and the popover, with `data-on:click-outside="Popover(#id)->target.close()"`.

A `popovertarget` button works too: the platform shows and hides the popover, and the component keeps its state and its events in sync. A platform close is instant, see [`auto` or `manual`](#auto-or-manual).

## Accessibility

The Popover API gives no role and no keyboard pattern: they depend on what the popover is. Follow the matching [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern:

- **Dropdown of links or controls**: the [disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/). Give the button `aria-expanded` and `aria-controls`, and keep `aria-expanded` in sync with the `open` and `close` events, as in the [dropdown example](./examples.md#dropdown). Do not add `aria-haspopup="menu"` or `role="menu"` unless you also implement the arrow key navigation of the [menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).
- **Tooltip**: the [tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/). Give the popover `role="tooltip"` and the trigger `aria-describedby`, open it on focus as well as on hover, and close it on <kbd>Esc</kbd>. Let the pointer move onto the tooltip without closing it: an `open()` during the leave transition keeps it shown, as in the [tooltip example](./examples.md#tooltip).

A `popovertarget` button gets the expanded state and the focus return from the browser. A button wired with `Action` does not: set `aria-expanded` yourself, and move the focus back to the button when <kbd>Esc</kbd> closes the popover from inside it.

## `auto` or `manual`

The value of the `popover` attribute is yours to choose. It decides who owns the dismissal:

- **`popover="manual"` (used in the examples)**: the component owns show and hide, so the **leave transition always plays**. Add the dismissal with `Action`: <kbd>Esc</kbd>, a click outside. Nothing closes the popover behind your back.
- **`popover="auto"`**: the platform adds light-dismiss (a click outside) and <kbd>Esc</kbd>, and closes the other `auto` popovers when this one opens. A platform close is **instant**: it skips the leave transition, like the native <kbd>Esc</kbd> of a `<dialog>`. The component listens to the native `toggle` event and still emits `close`.

## Positioning is yours

`Popover` ships no positioning opinion. Remove the user-agent overlay styles of the host and place it as you like: with `position: fixed`, or with native [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) as the examples do:

```css
#menu-trigger {
  anchor-name: --menu;
}

#menu {
  position: fixed;
  inset: auto;
  padding: 0;
  border: 0;
  background: transparent;
  position-anchor: --menu;
  position-area: bottom span-right;
  margin: 0.5rem 0 0;
}
```

## Transitions are fanned out

Like `Dialog`, the `Popover` awaits `Promise.all` over the `enter()` and `leave()` of every [`Transition`](/reference/items/Transition/) and [`ViewTransition`](/reference/items/ViewTransition/) child, and over the extensions registered on its [extendable events](./js-api.md#events):

- `open()` shows the popover **then** runs `enter()`, so the popover is already in the top layer when its child animates in.
- `close()` runs `leave()` **before** it hides the popover, so the popover is still painted while its child animates out.

With no transition child, open and close are instant.

See the [examples](./examples.md) for a live dropdown and tooltip, and the [JS API](./js-api.md) for the full list of properties, methods and events.
