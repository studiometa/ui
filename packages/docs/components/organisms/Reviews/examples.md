---
outline: deep
---

# Reviews <Badges :texts="badges" />

## Reviews section
<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  height="90vh"
  />

<script setup>
  import pkg from '@studiometa/ui/organisms/Reviews/package.json';

  const badges = [`v${pkg.version}`, 'Twig'];
</script>

Use this component to create Reinsurance. Horizontal list of elements with icons, title and content.

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package installed](/guide/installation/), simply include the Twig template component in your project:

```twig
{% include '@ui-pkg/organisms/Reviews/Reviews.twig' with {
  list: list
} only %}
```

## HTML Snippet

```twig
