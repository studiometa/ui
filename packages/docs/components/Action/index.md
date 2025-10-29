---
badges: [JS]
---

# Action <Badges :texts="$frontmatter.badges" />

The `Action` atom is a component who trigger an action on other components.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

This component can be directly imported and defined as a dependency of your application and then used directly with `data-...` attributes in your HTML.

In the following example, the buttons each have an `Action` component targeting the [`Transition`](/components/Transition/index.html) component in the page.

<PreviewPlayground
  :html="() => import('./stories/basic/app.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />

The `Action` components can control multiple targets:

<PreviewPlayground
  :html="() => import('./stories/basic/app-multiple.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />

And specify an additional selector to filter the targeted components:

<PreviewPlayground
  :html="() => import('./stories/basic/app-selector.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />


### Simple usage with the `Target` component

The `Target` component is a companion of the `Action` component that can be used to easily target other DOM elements without creating specific component.

<PreviewPlayground
  :html="() => import('./stories/target/app.twig')"
  :script="() => import('./stories/target/app.js?raw')"
  />

### Combining it with `Data` components

<PreviewPlayground
  :html="() => import('./stories/counter/app.twig')"
  :script="() => import('./stories/counter/app.js?raw')"
  />

### Listening to multiple events

The advanced HTML [option `on:<event>[.<modifier>]`](./js-api.md#on-event-modifier) can be used to listen to multiple events on a single `Action` component.

<PreviewPlayground
  :html="() => import('./stories/multiple-events/app.twig')"
  :script="() => import('./stories/multiple-events/app.js?raw')"
  />
