# MapboxMapStatic <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Mapbox/package.json';

  const badges = [`v${pkg.version}`, 'Twig', 'JS'];
</script>

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

{% include '@ui/molecules/Mapbox/MapboxMapStatic.twig' with options %}
```
