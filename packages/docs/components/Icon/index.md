---
badges: [Twig]
---

# Icon <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package is installed](/guide/installation/), simply include the template in your project:

```twig
{% include  '@ui/Icon/Icon.twig' with {
  name: 'globe',
} %}
```

You will be able to use local SVG files if you [configured the Twig Extension](/guide/installation/#in-a-twig-project) with the `$svg_path` parameter.

All [Iconify](https://iconify.design/) sets can also be used by specifying a name following the pattern `collection:icon-name`. You can browse, search and find icons from the Iconify sets with [icones.js.org](https://icones.js.org).

```twig
{% include  '@ui/Icon/Icon.twig' with {
  name: 'mdi:globe',
} %}
```

::: tip Automatic icon fetching
Iconify icons are automatically fetched from the API and saved as local SVG files when you run `composer install` or `composer update`. Only the icons actually used in your templates are downloaded.

You can also manually manage icons with:
- `composer ui:icons` — scan and fetch missing icons
- `composer ui:icons --dry-run` — preview detected icons
- `composer ui:icons --prune` — remove unused icons

See the [installation guide](/guide/installation/#icon-management) for full configuration options.
:::
