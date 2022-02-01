# Sticky <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Sticky/package.json';
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

### `content`

- Type: `string`

Content for the sticky element.

### `attr`

- Type: `array`

Custom attributes for the root element.

### `inner_attr`

- Type: `array`

Custom attributes for the inner element.

## Blocks

### `content`

Use this block to set the content of the sticky element, defaults to the [`content` parameter](#content).
