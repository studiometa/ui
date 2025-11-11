---
badges: [Twig]
---

# ImageGrid <Badges :texts="$frontmatter.badges" />

A component to display images in a destructured grid.

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Use this component directly in your Twig templates by providing it with an array of objects following the [`Figure` component](../Figure/index.md) parameters.

```twig
{% include '@ui/ImageGrid/ImageGrid.twig' with {
  images: [
    { src: 'https://picsum.photos/500/400', width: 500, height: 400 },
    { src: 'https://picsum.photos/600/400', width: 600, height: 400 },
    { src: 'https://picsum.photos/500/400', width: 500, height: 400 }
  ]
} %}
```

<llm-exclude>
<PreviewPlayground
  :zoom="0.8"
  :html="() => import('./stories/3-images/app.twig')"
  :script="() => import('./stories/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/3-images/app.twig
<<< ./stories/app.js

:::

</llm-only>

### Customizing the image output

The `ImageGrid` template exposes an `image` block which can be used to customize the rendering of each image.

In the following example, we wrap each image in a [`ScrollReveal` component](../ScrollReveal/index.md) to add transitions when each image becomes visible.

<<< ./stories/block-image/app.twig{18-25}

<llm-exclude>
<PreviewPlayground
  :zoom="0.8"
  :html="() => import('./stories/block-image/app.twig')"
  :script="() => import('./stories/block-image/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/block-image/app.twig
<<< ./stories/block-image/app.js

:::

</llm-only>
