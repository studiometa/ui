---
title: FigureVideoTwicpics Twig API
outline: deep
---

# Twig API

The `FigureVideoTwicpics` template extends the [`FigureVideo` template](/components/FigureVideo/twig-api.html) and adds support for TwicPics API.

## Parameters

### `twic_domain`

- Type: `string`

Use this parameter to configure your Twicpics domain.

### `twic_path`

- Type: `string`

Use this parameter to configure your Twicpics path.

### `twig_transform`

- Type: `Object`

Use this parameter to define custom transforms that should be used on the video. See [Twicpics documentation](https://www.twicpics.com/docs/reference/transformations) to discover available transformations.

**Examples**

```twig
{% include '@ui/FigureVideo/FigureVideoTwicpics.twig' with {
  twic_domain: 'org.twic.pics',
  twic_transform: {
    focus: 'auto'
  }
} %}
```
