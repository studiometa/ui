---
badges: [JS]
---

# ViewTransition <Badges :texts="$frontmatter.badges" />

The `ViewTransition` primitive is a drop-in alternative to the [`Transition`](/components/Transition/) component that animates state changes with the native [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) instead of CSS transition classes. It exposes the same `enter`, `leave` and `toggle` methods, so it can be used anywhere a `Transition` is.

Because the animation runs on a snapshot in the browser's view-transition layer — not on the live element — it sidesteps rendering glitches that CSS transforms can hit inside a top-layer `<dialog>`, and it lets unrelated elements (a backdrop and a panel, say) animate together as a single coordinated transition.

It is progressive enhancement: when the API is unavailable, the state change is applied instantly without animation.

## Usage

As a primitive, extend `ViewTransition` to create your own components:

```js
import { ViewTransition } from '@studiometa/ui';

export default class Togglable extends ViewTransition {
  static config = {
    name: 'Togglable',
  };
}
```

Describe the hidden and shown states with `data-option-leave-to` / `data-option-enter-to`, and give the element a unique `view-transition-name` so it animates on its own:

```html
<div
  data-component="Togglable"
  data-option-view-transition-name="panel"
  data-option-leave-to="translate-x-full"
  class="fixed inset-y-0 right-0 w-96 bg-white translate-x-full">
  ...
</div>
```

Then author the animation in CSS with the `::view-transition-old()` and `::view-transition-new()` pseudo-elements:

```css
@keyframes slide-in  { from { transform: translateX(100%); } }
@keyframes slide-out { to   { transform: translateX(100%); } }
::view-transition-new(panel) { animation: 300ms ease slide-in; }
::view-transition-old(panel) { animation: 300ms ease slide-out; }
```

Calling `enter()` removes `leave-to` (and adds `enter-to`); `leave()` does the reverse — each wrapped in a view transition.

## Co-animating several elements

The native API runs **one** view transition per document at a time. `ViewTransition` handles this for you: every `enter()` / `leave()` call made within the same tick is **batched into a single view transition**, so independent instances animate together with no configuration — just give each one a distinct `view-transition-name`.

```js
// Both animate as one coordinated transition.
await Promise.all([backdrop.enter(), panel.enter()]);
```

::: tip
Reach for `ViewTransition` when you need multiple elements to animate in sync, or to avoid transform-transition rendering bugs inside a modal `<dialog>`. Use [`Transition`](/components/Transition/) when you want fine-grained control over enter/leave classes and timing, or broader browser support.
:::

See the [examples](./examples.md) for a live demo, and the [JavaScript API](./js-api.md) for the full list of options, methods and events.
