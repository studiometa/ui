# LargeText <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/LargeText/package.json';
  const badges = [`v${pkg.version}`, 'JS', 'Twig'];
</script>

Use the large text component to easily add very nice looking title animation.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```twig
{% include '@ui/atoms/LargeText/LargeText.twig' with {
  content: 'Lorem ipsum dolor sit amet elit.'
} %}
```
