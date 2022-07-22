# Button <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Button/package.json';

  const badges = [`v${pkg.version}`, 'Twig'];
</script>

Use this component to create robust buttons.

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```twig
{% include '@ui-pkg/atoms/Button/Button.twig' %}
```
