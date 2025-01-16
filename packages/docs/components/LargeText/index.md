---
badges: [JS, Twig]
---

# LargeText <Badges :texts="$frontmatter.badges" />

Use the LargeText component to implement a horizontal scrolling text on scroll.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```twig
{% include '@ui/LargeText/LargeText.twig' with {
  content: 'Lorem ipsum dolor sit amet elit.'
} %}
```
