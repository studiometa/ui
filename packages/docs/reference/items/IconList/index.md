---
badges: [Twig]
---

# IconList <Badges :texts="$frontmatter.badges" />

The `IconList` Twig component displays a list of clickable icons, such as social links in a footer.

## Usage

```twig
  {% include '@ui/IconList/IconList.twig' with {
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
