---
badges: [JS]
---

# DataEffect <Badges :texts="$frontmatter.badges" />

Use the `DataEffect`.

## Table of content

- [Examples](./examples.md)
- [JavaScript API](./js-api.md)

## Usage

Import the components in your main app and use the `DataModel` component on HTML form elements and the `DataBind` and `DataComputed` components on other elements that need to be updated accordingly. The `DataEffect` component can be used to execute side effects when the value changes.

<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
