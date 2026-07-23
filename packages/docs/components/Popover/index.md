---
badges: [JS]
---

# Popover <Badges :texts="$frontmatter.badges" />

The `Popover` component is a headless wrapper around the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) — the non-modal sibling of [`Dialog`](/components/Dialog/). It offloads to the platform what a floating panel needs: top-layer stacking (it always paints above the page, no `z-index` wars), <kbd>Esc</kbd> to close and, with `popover="auto"`, light-dismiss. It owns only the orchestration of your transitions.

It ships no markup and no positioning: you author the HTML, wire the triggers with [`Action`](/components/Action/), animate with [`Transition`](/components/Transition/) or [`ViewTransition`](/components/ViewTransition/) children, and place the panel with your own CSS. A dropdown menu, a tooltip and a rich hover-card are all the same `Popover` — only the trigger and the positioning change.

## Usage

Register the component, along with the [`Action`](/components/Action/) and [`Transition`](/components/Transition/) components used by the authored HTML:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Popover, Transition } from '@studiometa/ui';

registerComponent(Action);
registerComponent(Popover);
registerComponent(Transition);
```

The `Popover` lives on the `[popover]` element; inside it sits a transition child — the visible, animated panel. Triggers live anywhere on the page and call the component through `Action`:

```html
<!-- The trigger lives anywhere on the page. -->
<button
  type="button"
  data-component="Action"
  data-on:click="Popover(#menu)->target.toggle()"
  aria-haspopup="true"
  aria-controls="menu">
  Menu
</button>

<div
  popover="manual"
  id="menu"
  data-component="Action Popover"
  data-on:keydown="event.key === 'Escape' && Popover.close()">
  <div
    data-component="Transition"
    data-option-enter-active="transition duration-200 ease-out"
    data-option-enter-from="opacity-0"
    data-option-leave-active="transition duration-150 ease-in"
    data-option-leave-to="opacity-0"
    data-option-leave-keep
    class="p-2 rounded-lg bg-white shadow-xl opacity-0">
    <a href="/profile" data-component="Action" data-on:click="Popover(#menu)->target.close()">Profile</a>
    <a href="/settings" data-component="Action" data-on:click="Popover(#menu)->target.close()">Settings</a>
  </div>
</div>
```

## Triggers are delegated to `Action`

The `Popover` class has no refs and adds no event listeners of its own — every interaction is wired declaratively with [`Action`](/components/Action/), calling the component's methods:

- **Dropdown (click):** `data-on:click="Popover(#id)->target.toggle()"` on the trigger, and `data-on:click="Popover(#id)->target.close()"` on each item.
- **Tooltip / hover-card (hover + focus):** `data-on:mouseenter` / `data-on:focus` call `open()`, `data-on:mouseleave` / `data-on:blur` call `close()`.
- **<kbd>Esc</kbd>:** `data-on:keydown="event.key === 'Escape' && Popover.close()"` on the popover itself.

## `auto` vs `manual`

The `popover` attribute value is yours to choose, and it decides who owns dismissal:

- **`popover="manual"` (used in the examples):** the component owns show/hide, so the **leave transition always plays**. You re-add dismissal with `Action` (<kbd>Esc</kbd>, items closing on click). Nothing light-dismisses it behind your back.
- **`popover="auto"`:** the platform adds light-dismiss (outside click) and <kbd>Esc</kbd> for free, but a platform-driven close is **instant** — it skips the leave transition, exactly like the native <kbd>Esc</kbd> path of a `<dialog>`. The component listens to the native `toggle` event and keeps its state (and the `close` event) in sync when this happens.

## Positioning is yours

`Popover` ships no positioning opinion. Neutralize the user-agent overlay styles on the host and place it however you like — `position: fixed`, or native [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) as the examples do:

```css
#menu-trigger { anchor-name: --menu; }
#menu {
  position: fixed;
  inset: auto;
  background: transparent;
  position-anchor: --menu;
  position-area: bottom span-right;
  margin-top: 0.5rem;
}
```

## Transitions are fanned out

Like `Dialog`, the `Popover` awaits `Promise.all` over the `enter()`/`leave()` of every [`Transition`](/components/Transition/) and [`ViewTransition`](/components/ViewTransition/) child:

- `open()` shows the popover **then** runs `enter()`, so it is already in the top layer when its child animates in.
- `close()` runs `leave()` **before** hiding it, so the popover is still painted while its child animates out.

A plain `Transition` (a CSS opacity/transform) is the right default for a small panel; reach for a `ViewTransition` only when a transform would otherwise judder — and if you add a backdrop, carry over the top-layer stacking guards from the [drawer example](/components/Dialog/#building-a-drawer).

With no transition child, `Promise.all([])` resolves immediately and open/close are instant.

See the [examples](./examples.md) for a live dropdown and tooltip, and the [JS API](./js-api.md) for the full list of methods and events.
