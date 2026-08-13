---
badges: [JS]
---

# MotionView <Badges :texts="$frontmatter.badges" />

The `MotionView` component wraps DOM updates in Motion's [`animateView()`](https://motion.dev/docs/animate-view) so the change plays as a view transition. It is a drop-in alternative to the [`ViewTransition`](/reference/items/ViewTransition/) component — same `enter()`/`leave()`/`toggle()` methods, `state` property, events and `viewTransitionName`/`enterTo`/`leaveTo` options — but the animation is declared with Motion keyframes and transitions (including springs) instead of the `::view-transition-*` CSS pseudo-elements.

Containment is the wiring: with the [`auto` option](./js-api#auto) (on by default), a mounted `MotionView` wraps any `dom-update` announced inside its subtree — by [`Fetch`](/reference/items/Fetch/) or [`DataBind`](/reference/items/DataBind/)'s `data-bind:if` — and joins the lifecycle of a containing [`Dialog`](/reference/items/Dialog/), with zero wiring attributes on either side. See [ambient wiring](./js-api#ambient-wiring).

`MotionView` is part of `@studiometa/ui-motion`, alongside [`Motion`](/reference/items/Motion/), [`MotionScrollTimeline`](/reference/items/MotionScrollTimeline/) and [`MotionSequence`](/reference/items/MotionSequence/).

## Usage

Option values are parsed as JSON, so object keys must be quoted:

<!-- prettier-ignore-start -->
```html {2,3}
<div
  data-component="MotionView"
  data-option-enter-to="is-open"
  data-option-transition='{ "type": "spring", "bounce": 0.3 }'>
  …
</div>

<button data-component="Action" data-on:click="MotionView->target.toggle()">Toggle</button>
```
<!-- prettier-ignore-end -->

See the [examples](./examples.md) for live demos of the ambient integrations, and the [JavaScript API](./js-api.md) for the full list of options, methods and events.
