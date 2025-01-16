# IconInline <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/Icon/package.json';
  const badges = [`v${pkg.version}`, 'Twig'];
</script>

## Table of content

- [Examples](./examples.html)
- [Twig API](./twig-api.html)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```twig
{% include  '@ui/Icon/IconInline.twig' with {
  name: 'globe',
} %}
```
