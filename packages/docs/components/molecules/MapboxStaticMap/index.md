---
badges: [Twig]
---

# MapboxStaticMap <Badges :texts="$frontmatter.badges" />

The `MapboxStaticMap` component can be used to display custom maps anywhere, without having to load the full Mapbox GL JavaScript library. You can test all features from this API on the [static images API playground](https://docs.mapbox.com/playground/static/) from Mapbox.

## Table of content

- [Examples](./examples.html)
- [Twig API](./twig-api.html)

## Usage

Register the [Figure](/components/atoms/Figure/) component in your JavaScript app and use the Twig template to display images.

```js {2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Figure } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'Base',
    components: {
      Figure,
    }
  };
}

export default createApp(App);
```

```twig{5}
{% set options = {
  access_token: '<YOUR_MAPBOX_ACCESS_TOKEN>',
} %}

{% include '@ui/molecules/MapboxStaticMap/MapboxStaticMap.twig' with options %}
```
