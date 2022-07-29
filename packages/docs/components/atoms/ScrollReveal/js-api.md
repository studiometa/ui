---
title: ScrollReveal JS API
---

# JS API

The `ScrollReveal` class extends the [`Transition` primitive](/components/primitives/Transition/) with the [`withMountWhenInView` decorator](https://js-toolkit.studiometa.dev/api/decorators/withMountWhenInView.html). As it inherits their APIs, make sure to have a look at their own API references too.

## Options

### `repeat`

- Type: `boolean`
- Default: `false`

Configure wether or not the reveal animation should be replayed each time the element enters the viewport or just once.

```html
<div data-component="ScrollReveal" data-option-repeat>
  <div data-ref="target">...</div>
</div>
```

## Refs

### `target`

- Type: `HTMLElement`

The `target` refs should be added on the element which will be animated on reveal.

::: warning Not defining a target
If no target ref is found, the component will default to applying the transition to the root element. This can have some unwanted effect when using animations with transformations, as it can mess with the intersection detection made with the `IntersectionObserver` API.

Scroll down and up in the example below to see the bug in action:

<PreviewIframe src="./stories/no-target-ref/story.html" height="400px" no-controls />

It is recommended to always define a `target` ref to avoid such cases.
:::
