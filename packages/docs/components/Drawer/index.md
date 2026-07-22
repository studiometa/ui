---
badges: [JS]
---

# Drawer <Badges :texts="$frontmatter.badges" />

The `Drawer` component is a [`Dialog`](/components/Dialog/) whose panel slides in from an edge of the screen. It shares the whole `Dialog` API — modality, scroll-lock, focus handling, `Action`-driven triggers and fanned-out transitions — and adds a single `position` option.

That option is deliberately thin: it only picks the Tailwind translate class fed to the panel's transition as its hidden state. There is **no matrix or geometry maths** — the slide is a plain CSS `translate` class animated by a transition child.

## Usage

Register the component with [`Action`](/components/Action/) and the transition primitive you use for the panel. For a smooth slide in **every** browser, animate the panel with [`ViewTransition`](/components/ViewTransition/) (see [Firefox note](#firefox-and-viewtransition) below); [`Transition`](/components/Transition/) is the fallback.

```js{2,8-10}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Drawer, ViewTransition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Drawer,
      ViewTransition,
    },
  };
}

export default createApp(App, document.body);
```

Author the same transparent `<dialog>` host as a [`Dialog`](/components/Dialog/), with a fading backdrop and a **panel flagged with `data-drawer-panel`**. The `Drawer` injects the position's slide class into that panel's hidden-state options and its initial class on mount:

```html
<button
  type="button"
  data-component="Action"
  data-on:click="Drawer(#my-drawer)->target.open()">
  Open drawer
</button>

<dialog
  id="my-drawer"
  data-component="Action Drawer"
  data-option-position="right"
  data-on:cancel.prevent="Drawer.close()"
  class="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none bg-transparent">
  <!-- Fading backdrop -->
  <div
    data-component="Action Transition"
    data-on:click="Drawer(#my-drawer)->target.close()"
    data-option-enter-active="transition duration-300 ease-out"
    data-option-enter-from="opacity-0"
    data-option-leave-active="transition duration-300 ease-in"
    data-option-leave-to="opacity-0"
    data-option-leave-keep
    class="fixed inset-0 bg-black/50 opacity-0"></div>

  <!-- Sliding panel -->
  <div
    data-component="ViewTransition"
    data-drawer-panel
    data-option-view-transition-name="drawer-panel"
    class="absolute inset-y-0 right-0 w-80 max-w-full p-8 bg-white shadow-2xl">
    <h2>Drawer title</h2>
    <p>Your content here.</p>
    <button
      type="button"
      data-component="Action"
      data-on:click="Drawer(#my-drawer)->target.close()">
      Close
    </button>
  </div>
</dialog>
```

The panel does not need to carry the slide class in its markup: the `Drawer` adds it for you based on `position`. The backdrop (no `data-drawer-panel`) is left untouched, so it keeps fading while the panel slides.

## The `data-drawer-panel` marker

A `Drawer` contains several transition children — at least a backdrop and a panel. The `data-drawer-panel` boolean attribute tells the `Drawer` which one is the sliding panel, so it feeds the slide class to that child only. You can flag more than one child if several elements should slide together.

## The `position` option

`position` maps to a translate class:

| `position` | Slide class          | Panel rests at |
| ---------- | -------------------- | -------------- |
| `top`      | `-translate-y-full`  | `inset-x-0 top-0`     |
| `right`    | `translate-x-full`   | `inset-y-0 right-0`   |
| `bottom`   | `translate-y-full`   | `inset-x-0 bottom-0`  |
| `left`     | `-translate-x-full`  | `inset-y-0 left-0`    |

Position the panel against the matching edge with layout classes on the element; the `Drawer` only handles the offscreen translate.

## Firefox and `ViewTransition` {#firefox-and-viewtransition}

A panel animated with a CSS `transform` transition inside a modal `<dialog>` **judders in Firefox** once it is translated past roughly its own width — a rendering bug in how Firefox paints transforms in the top layer (not something JS can observe or work around with `will-change`, `translate3d`, etc.).

Animating the panel with [`ViewTransition`](/components/ViewTransition/) fixes it: the native View Transitions API animates a snapshot in the view-transition overlay instead of the live element in the dialog's top layer, sidestepping the bug (verified smooth in Firefox 151). Give the backdrop and the panel each a unique `view-transition-name` and their concurrent `enter()`/`leave()` calls auto-batch into a single coordinated transition.

Use [`Transition`](/components/Transition/) as a fallback for elements or browsers without the API, or for a non-modal (`data-option-no-modal`) drawer where the bug does not apply.

## The `<dialog>` gotcha

::: danger Never put a `display` utility on the host `<dialog>`
As with [`Dialog`](/components/Dialog/#the-dialog-gotcha), do not add `grid`, `flex`, `block`, … to the `<dialog>` element — it overrides the user-agent `dialog:not([open]) { display: none }` rule, leaving a closed drawer as a full-viewport layer that swallows every click. Keep layout on inner elements.
:::

See the [JavaScript API](./js-api.md) for the full list of options, methods and events.
