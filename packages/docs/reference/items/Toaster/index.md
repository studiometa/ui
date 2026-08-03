---
badges: [JS]
---

# Toaster <Badges :texts="$frontmatter.badges" />

The `Toaster` component is a headless notifications region. It owns only what a toaster genuinely needs — creating a toast from a template, a pausable auto-dismiss timer, and orchestrating the enter/leave animation — and leaves the markup, styling and the animation itself to you, exactly like [`Dialog`](/reference/items/Dialog/).

It ships no markup: you author two permanent [`aria-live`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) regions and a `<template>`, wire the triggers with [`Action`](/reference/items/Action/), and describe the animation in CSS. Because the regions live in the DOM from mount, a toast inserted into one is announced by assistive technology **without focus ever moving** — the reason a toaster is not just a non-modal `Dialog`.

## Usage

Register the component along with [`Action`](/reference/items/Action/):

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Action, Toaster } from '@studiometa/ui';

registerComponent(Action);
registerComponent(Toaster);
```

Author a fixed, click-through region that holds two live regions and the toast template. The `polite` ref announces info and success toasts once the screen reader is idle; the `assertive` ref announces errors immediately. Each toast is cloned from the `template` ref:

```html
<div
  data-component="Toaster"
  class="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end gap-2 p-4">
  <!-- Polite region: info & success -->
  <div data-ref="polite" aria-live="polite" aria-atomic="false" aria-relevant="additions"
    class="flex w-full flex-col items-end gap-2"></div>
  <!-- Assertive region: errors -->
  <div data-ref="assertive" role="alert" aria-live="assertive" aria-atomic="false" aria-relevant="additions"
    class="flex w-full flex-col items-end gap-2"></div>

  <!-- Cloned per toast. `[data-message]` receives the text, `[data-close]` dismisses. -->
  <template data-ref="template">
    <div class="toast pointer-events-auto flex w-80 items-start gap-3 rounded-lg border-l-4 bg-white p-4 shadow-lg">
      <p data-message class="min-w-0 flex-1 text-sm"></p>
      <button type="button" data-close aria-label="Dismiss notification">&times;</button>
    </div>
  </template>
</div>
```

Trigger toasts from anywhere on the page with [`Action`](/reference/items/Action/):

```html
<button
  type="button"
  data-component="Action"
  data-on:click="Toaster->target.show('Your changes have been saved.', { type: 'success' })">
  Save
</button>
```

## The two live regions

The region markup is fixed for accessibility, not decoration:

- **Both regions exist from mount.** A live region announces content inserted **after** it is in the accessibility tree, so the regions are permanent and toasts are inserted into them. The `Toaster` element itself carries no `aria-live` — each region does.
- **`aria-atomic="false"` + `aria-relevant="additions"`** make the screen reader announce only the newly added toast, not the whole growing stack.
- **`pointer-events-none` on the region, `pointer-events-auto` on each toast**, so the empty layer never intercepts clicks meant for the page.

The `assertive` ref is optional: with it absent, error toasts fall back to the polite region.

## Styling the animation

The stack animates through the native View Transitions API. Give every toast a `view-transition-class` so one set of pseudo-element rules styles them all — the unique `view-transition-name` is assigned per toast by the component:

```css
.toast { view-transition-class: toast; }

/* Toasts that merely change slot slide smoothly to their new position. */
::view-transition-group(.toast) {
  animation-duration: 300ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Slide ONLY entering/leaving toasts. */
::view-transition-new(.toast):only-child { animation: toast-in 300ms ease-out both; }
::view-transition-old(.toast):only-child { animation: toast-out 200ms ease-in both; }
@keyframes toast-in { from { opacity: 0; transform: translateY(12px); } }
@keyframes toast-out { to { opacity: 0; transform: translateY(12px); } }
```

::: tip Scope the enter/leave keyframes with `:only-child`
`::view-transition-new(.toast)` and `-old(.toast)` match **every** toast captured in a transition, including the ones that merely persist while a sibling is added or removed. Applying the slide keyframes to those makes each surviving toast shimmy up and down as the stack reflows. `:only-child` matches a snapshot only when its `::view-transition-image-pair` holds just a new (entering) or just an old (leaving) child, so persisting toasts keep the default cross-fade and stay put.
:::

Author a `@media (prefers-reduced-motion: reduce)` block that sets these animations to `none` to respect the user's motion preference — the toast still appears and disappears, just without the slide.

## Triggers and transitions

The `Toaster` class adds no listeners of its own beyond the per-toast close button and hover/focus handlers. Every trigger is wired declaratively with [`Action`](/reference/items/Action/), calling [`show()`](./js-api.md#show) on the target. Appends and removals run through the shared [`viewTransition`](/reference/items/ViewTransition/) scheduler, which **batches every mutation requested in the same tick into a single coordinated transition** — so firing three toasts at once animates them as one — and falls back to a synchronous update when the View Transitions API is unavailable, making the animation pure progressive enhancement.

Each toast auto-dismisses after [`duration`](./js-api.md#duration) seconds. The timer **pauses while the pointer hovers or the focus is inside the toast** and resumes on leave, so a toast the user is reading or acting on never disappears under them ([WCAG 2.2.1](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html)). Pass `duration: 0` for a sticky toast that only closes on demand.

See the [examples](./examples.md) for a live demo, and the [JavaScript API](./js-api.md) for the full list of options, methods and events.
