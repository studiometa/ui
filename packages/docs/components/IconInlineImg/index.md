---
badges: [Twig]
---

# IconInlineImg <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.html)
- [Twig API](./twig-api.html)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```twig
{% include  '@ui/Icon/IconImg.twig' with {
  name: 'globe',
} %}
```
