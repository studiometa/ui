---
outline: deep
---

# CircularMarquee <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Button/package.json';

  const badges = [`v${pkg.version}`, 'Twig'];
</script>

Use this component to create CircularMarquee, a spinning on scroll circular text. This is made using the `<svg>` capabilities.

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package installed](/guide/installation/), simply include the Twig template and load the JavaScript component in your project:

```twig
{% include '@ui-pkg/atoms/CircularMarquee/CircularMarquee.twig' with {
  id: 'unique-id',
  radius: 120,
  outer_radius: 150,
  content: ' My text content'
} only %}
```
