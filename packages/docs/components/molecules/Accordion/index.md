# Accordion <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Accordion/package.json';
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'Twig', 'JS'];

  const tabs = [
    {
      label: 'app.js',
      lang: 'js',
      content: appJsRaw,
    },
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    }
  ];
</script>

<PreviewIframe class="block-full-width" src="./story.html" />

<Tabs :items="tabs" />

## Parameters

### `items`

- Type: `array<{ title: string, content: unknown, attr: array }>`

List of items to display.

### `attr`

- Type: `array`

Customize the root element attributes.

### `item_attr`

- Type: `array`

Customize each item element attributes.

### `item_container_attr`

- Type: `array`

Customize each item container element attributes.

## Blocks

### `title`

Use this block to customize each item's title, defaults to `item.title`.

### `content`

Use this block to customize each item's content, defaults to `item.content`.
