# Accordion <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Accordion/package.json';
  const badges = [`v${pkg.version}`, 'Twig', 'JS'];
</script>

## Table of content

- [Examples](./examples.html)
- [Twig API](./twig-api.html)

## Usage

Once the [package installed](/guide/installation/), simply include the template in your project:

```js{2,8}
import { Base, createApp } from '@studiometa/js-toolkit';
import { Accordion } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Accordion,
    },
  };
}

export default createApp(App, document.body);
```

```twig{16}
{% set items = [
  {
    title: 'Title #1',
    content: 'Content #1'
  },
  {
    title: 'Title #2',
    content: 'Content #2'
  },
  {
    title: 'Title #3',
    content: 'Content #3'
  }
] %}

{% include '@ui/molecules/Accordion/Accordion.twig' with { items: items } %}
```
