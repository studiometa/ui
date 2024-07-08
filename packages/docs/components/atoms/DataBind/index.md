---
outline: deep
---

# DataBind <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Data/package.json';
  const badges = [`v${pkg.version}`, 'JS'];
</script>

Use the `DataBind`, `DataModel` and `DataComputed` components to bind and synchronize data between DOM elements.

## Table of content

- [Examples](./examples.html)
- [`DataBind` JavaScript API](./data-bind-js-api.html)
- [`DataComputed` JavaScript API](./data-computed-js-api.html)
- [`DataModel` JavaScript API](./data-model-js-api.html)

## Usage

Import the components in your main app and use the `DataModel` component on HTML form elements and the `DataBind` and `DataComputed` components on other elements that need to be updated accordingly.

<PreviewPlayground
  :html="() => import('./stories/basic.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
