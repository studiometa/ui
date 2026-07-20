---
badges: [JS, Twig]
---

# LargeText <Badges :texts="$frontmatter.badges" />

Use the LargeText component to implement a horizontal scrolling text on scroll.

## Usage

After you install the package, include the template in your project:

```twig
{% include '@ui/LargeText/LargeText.twig' with {
  content: 'Lorem ipsum dolor sit amet elit.'
} %}
```
