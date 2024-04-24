---
badges: [Twig]
---

# IconList <Badges :texts="$frontmatter.badges" />

The `IconList` molecules is a (Twig only) component who displays a list of clickable icons. Useful for display social links in a footer by example.

## Table of content

- [Examples](./examples)
- [Twig API](./twig-api)

## Usage

```twig
  {% include '@ui/molecules/IconList/IconList.twig' with {
    items: {
      x: 'https://x.com',
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      globe: { href: 'https://website.domain', label: 'Site internet' },
      copy: {
        label: 'Copier le lien dans le presse-papier',
        attr: { data_component: 'ClipboardCopy' }
      }
    }
  } only %}
```
