---
badges: [Twig]
---

# Reinsurance <Badges :texts="$frontmatter.badges" />

Use the `Reinsurance` component to display a horizontal list of items, each with an icon, a title, and content. It suits a row of reassurance points such as shipping, returns, or support.

## Usage

After you install the package, include the Twig template in your project:

```twig
{% include '@ui/Reinsurance/Reinsurance.twig' with {
  list: list
} only %}
```
