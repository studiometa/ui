---
title: FigureTwicpics Twig API
outline: deep
---

# Twig API

The `FigureTwicpics` template extends the [`Figure` template](/components/Figure/twig-api.md) and adds support for TwicPics API.

## Parameters

### `twic_domain`

- Type: `string`

Use this parameter to configure your Twicpics domain.

### `twic_path`

- Type: `string`

Use this parameter to configure your Twicpics path.

### `twic_placeholder`

- Type: `'preview' | 'meancolor' | 'maincolor' | Object`

Use this parameter to customise the placeholder used when lazyloading images. It can either be one of the preview type provided by TwicPics, or an object defining custom transforms like the [`twic_transform` parameter](#twic-transform).

**Examples**
```twig
{# Will display a blurred version of the image #}
{% include '@ui/Figure/FigureTwicpics.twig' with {
  twic_domain: 'org.twic.pics',
  twic_placeholder: 'preview',
} %}

{# Will display a lighter version of the image with its quality degraded to 5 #}
{% include '@ui/Figure/FigureTwicpics.twig' with {
  twic_domain: 'org.twic.pics',
  twic_placeholder: {
    quality_max: 5,
  },
} %}
```

### `twic_transform`

- Type: `Object`

Use this parameter to define custom transforms that should be used on the image. See [Twicpics documentation](https://www.twicpics.com/docs/reference/transformations) to discover available transformations.

**Examples**

```twig
{% include '@ui/Figure/FigureTwicpics.twig' with {
  twic_domain: 'org.twic.pics',
  twic_transform: {
    focus: 'auto'
  }
} %}
```

