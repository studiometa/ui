---
badges: [Twig]
---

# IconImg <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package is installed](/guide/installation/), simply include the template in your project:

```twig
{% include  '@ui/Icon/IconImg.twig' with {
  name: 'globe',
} %}
```

You will be able to use local SVG files if you [configured the Twig Extension](/guide/installation/#in-a-twig-project) with the `$svg_path` parameter.

All [Iconify](https://iconify.design/) sets can also be used by specifying a name following the pattern `collection:icon-name`. You can browse, search and find icons from the Iconify sets with [icones.js.org](https://icones.js.org).

```twig
{% include  '@ui/Icon/IconImg.twig' with {
  name: 'mdi:globe',
} %}
```
