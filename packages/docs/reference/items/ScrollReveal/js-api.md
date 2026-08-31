---
title: ScrollReveal JS API
---

# JS API

The `ScrollReveal` class is built on the [`withTransition` mixin](/reference/items/withTransition/), whose [options, methods and events](/reference/items/Transition/js-api) it inherits. Unlike the other viewport-driven components it does not use a mount strategy: `repeat` chooses between revealing once and revealing on every entry, and that is a runtime choice a static strategy cannot express, so the component mounts normally and subscribes to the viewport itself. Its `intersectionObserver` option is therefore a real observer configuration.

## Options

### `repeat`

- Type: `boolean`
- Default: `false`

Configures whether or not the reveal animation should be replayed each time the element enters the viewport or just once.

Repeated reveals are skipped while the page is scrolling back up, so an element does not replay on the way out.

```html
<div data-component="ScrollReveal" data-option-repeat>
  <div data-ref="target">...</div>
</div>
```

### `enterKeep`

- Type: `boolean`
- Default: `true`

Unlike [`Transition`](/reference/items/Transition/js-api#enterkeep), which defaults to `false`, `ScrollReveal` keeps the `enterTo` classes on the target after the reveal — a revealed element is meant to stay revealed. Turn it off with `data-option-no-enter-keep`.

### `intersectionObserver`

- Type: `object`
- Default: `{ threshold: [0, 1] }`

The `IntersectionObserverInit` passed straight to `useInView()`. Use it to set a `rootMargin` offset or a different `threshold`.

```html
<div data-component="ScrollReveal" data-option-intersection-observer='{"rootMargin":"100px"}'>
  <div data-ref="target">...</div>
</div>
```

Because the default is an object, it is declared as a factory (`default: () => ({ threshold: [0, 1] })`) so that each instance gets its own.

## Refs

### `target`

- Type: `HTMLElement`

The `target` refs should be added on the element which will be animated on reveal.

::: warning Not defining a target
If no target ref is found, the component will default to applying the transition to the root element. This can have some unwanted effect when using animations with transformations, as it can mess with the intersection detection made with the `IntersectionObserver` API.

Scroll down and up in the example below to see the bug in action:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/no-target-ref/app.twig')"
  :script="() => import('./stories/no-target-ref/app.js?raw')"
  height="400px"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/no-target-ref/app.twig
<<< ./stories/no-target-ref/app.js

:::

</llm-only>

It is recommended to always define a `target` ref to avoid such cases.
:::

## Properties

### `target`

- Type: `HTMLElement`

What the enter transition runs on: the `target` ref, or the root element when there is no `target` ref.

## Methods

### `reveal()`

- Returns: `void`

Runs the enter transition unless this entry should be ignored — the first call always reveals, later ones only with `repeat` and only while not scrolling up.

## Events

`ScrollReveal` emits no event of its own. It inherits the six `transition-*` events from [`withTransition`](/reference/items/Transition/js-api#events); a reveal fires the `transition-enter*` half.
