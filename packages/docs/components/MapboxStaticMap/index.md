---
badges: [Twig]
---

# MapboxStaticMap <Badges :texts="$frontmatter.badges" />

The `MapboxStaticMap` component can be used to display custom maps anywhere, without having to load the full Mapbox GL JavaScript library. You can test all features from this API on the [static images API playground](https://docs.mapbox.com/playground/static/) from Mapbox.

## Usage

Register the [Figure](/components/Figure/) component in your JavaScript app and use the Twig template to display images.

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Figure } from '@studiometa/ui';

registerComponent(Figure);
```

```twig{5}
{% set options = {
  access_token: '<YOUR_MAPBOX_ACCESS_TOKEN>',
} %}

{% include '@ui/MapboxStaticMap/MapboxStaticMap.twig' with options %}
```
