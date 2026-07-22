---
badges: [JS]
---

# Dialog <Badges :texts="$frontmatter.badges" />

The `Dialog` component is a headless wrapper around the native [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) element. It offloads to the platform everything a modal needs — modality, focus trap, background `inert`, focus restore, top-layer stacking and <kbd>Esc</kbd> to close — and owns only the few things the platform does not give for free: scroll-lock, an optional focus-trap for the non-modal path, and orchestrating your transitions.

It ships **no markup**: you author the HTML, wire the triggers with [`Action`](/components/Action/) and describe the animations with [`Transition`](/components/Transition/) or [`ViewTransition`](/components/ViewTransition/) children. The `Dialog` fans `enter()`/`leave()` out to every transition child it contains — the backdrop and the box are just two of them.

A **drawer** is not a separate component — it is a `Dialog` whose panel you anchor to an edge with your own CSS and, optionally, slide in with a transition. See [Building a drawer](#building-a-drawer).

## Usage

Register the component, along with the [`Action`](/components/Action/) and [`Transition`](/components/Transition/) components used by the authored HTML:

```js{2,8-10}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Action, Dialog, Transition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Action,
      Dialog,
      Transition,
    },
  };
}

export default createApp(App, document.body);
```

The `<dialog>` becomes a transparent, full-viewport host. Inside it live an optional backdrop and the box, each a transition child with its own hidden/shown classes. Triggers are delegated to `Action`:

```html
<!-- The trigger lives anywhere on the page. -->
<button
  type="button"
  data-component="Action"
  data-on:click="Dialog(#my-dialog)->target.open()">
  Open dialog
</button>

<dialog
  id="my-dialog"
  data-component="Action Dialog"
  data-on:cancel.prevent="Dialog.close()"
  class="fixed inset-0 m-0 p-0 w-full h-full max-w-none max-h-none bg-transparent overflow-y-auto">
  <!-- Clickable, fading backdrop -->
  <div
    data-component="Action Transition"
    data-on:click="Dialog(#my-dialog)->target.close()"
    data-option-enter-active="transition duration-300 ease-out"
    data-option-enter-from="opacity-0"
    data-option-leave-active="transition duration-200 ease-in"
    data-option-leave-to="opacity-0"
    data-option-leave-keep
    class="fixed inset-0 bg-black/50 opacity-0"></div>

  <!-- Centering layer — pointer-events-none so clicks fall through to the backdrop -->
  <div class="pointer-events-none relative flex min-h-full items-center justify-center p-4">
    <div
      data-component="Transition"
      data-option-enter-active="transition duration-300 ease-out"
      data-option-enter-from="opacity-0 scale-95"
      data-option-leave-active="transition duration-200 ease-in"
      data-option-leave-to="opacity-0 scale-95"
      data-option-leave-keep
      class="pointer-events-auto relative w-full max-w-lg p-8 rounded-lg bg-white shadow-2xl opacity-0 scale-95">
      <h2>Dialog title</h2>
      <p>Your content here.</p>
      <button
        type="button"
        data-component="Action"
        data-on:click="Dialog(#my-dialog)->target.close()">
        Close
      </button>
    </div>
  </div>
</dialog>
```

Because the native `::backdrop` pseudo-element cannot be class-transitioned, neutralize it and let the backdrop element cover everything:

```css
dialog::backdrop {
  background: transparent;
}
```

## Triggers are delegated to `Action`

The `Dialog` class has **no refs and adds no event listeners of its own**. Every interaction is wired declaratively with [`Action`](/components/Action/):

- **Open / close / toggle** — call the methods on the `Dialog` target: `Dialog(#id)->target.open()`, `.close()`, `.toggle()`.
- **<kbd>Esc</kbd>** — the `<dialog>` fires a native `cancel` event. `data-on:cancel.prevent="Dialog.close()"` runs your animated close instead of the instant native one. Omit it and the browser closes the dialog instantly (no leave transition).
- **Click outside** — `data-on:click="event.target === $el && Dialog.close()"` closes when the click lands on the dialog host itself; in the backdrop-element pattern above the backdrop handles it directly with its own `Action`.

Any trigger you omit simply falls back to the platform behavior — the class does not care.

## Transitions are fanned out

The `Dialog` awaits `Promise.all` over the `enter()`/`leave()` of **every** [`Transition`](/components/Transition/) and [`ViewTransition`](/components/ViewTransition/) child:

- `enter()` runs **after** `showModal()`/`show()`, so the dialog is already in the top layer when its children animate in.
- `leave()` runs **before** `dialog.close()`, so the dialog is still painted while its children animate out.

With no transition child, `Promise.all([])` resolves immediately and open/close are instant.

## Building a drawer

There is no `Drawer` component: a drawer is a `Dialog` whose panel is **anchored to an edge with your own CSS**. Positioning and animation are entirely author-controlled — the library ships no drawer opinion.

Anchor the panel to the edge you want with layout classes and let the `Dialog` handle the rest:

```html
<dialog id="drawer" data-component="Action Dialog" data-on:cancel.prevent="Dialog.close()">
  <!-- backdrop child … -->
  <!-- Right-anchored panel: position is just these classes. -->
  <div class="absolute inset-y-0 right-0 w-80 max-w-full bg-white">…</div>
</dialog>
```

Out of the box the panel appears and disappears **instantly** with the dialog. To slide it in, make the panel an **optional** transition child:

- **`ViewTransition` (recommended)** — it animates a snapshot in the view-transition overlay rather than the live element in the dialog's top layer, so the slide stays smooth in Firefox (a transform-transition inside a modal `<dialog>` judders there; see [#532](https://github.com/studiometa/ui/issues/532)). Give the panel a unique `view-transition-name` and author the slide with `::view-transition-old()` / `::view-transition-new()` keyframes. The backdrop and panel batch into a single coordinated transition.
- **`Transition` / CSS** — a plain [`Transition`](/components/Transition/) child with `translate` classes works too, as a fallback for browsers without the View Transitions API or for a non-modal (`data-option-no-modal`) drawer where the Firefox bug does not apply.

The slide **direction** is yours: it is just the translate class / keyframes you choose (`translate-x-full` from the right, `-translate-x-full` from the left, `translate-y-full` from the bottom, and so on) paired with the matching edge-anchoring classes.

See the [drawer example](./examples.md#drawer) for a complete right-side drawer sliding in via `ViewTransition`.

## The `<dialog>` gotcha

::: danger Never put a `display` utility on the host `<dialog>`
Do **not** add `grid`, `flex`, `block`, … to the `<dialog>` element. Those override the user-agent rule `dialog:not([open]) { display: none }`, so a **closed** dialog stays laid out as a full-viewport `fixed inset-0` layer and silently intercepts every click on the page — nothing else can be clicked and nothing opens.

Keep all layout on inner elements (the centering layer, the box) and let the dialog's native open/closed `display` stand.
:::

See the [examples](./examples.md) for a live demo, and the [JavaScript API](./js-api.md) for the full list of options, methods and events.
