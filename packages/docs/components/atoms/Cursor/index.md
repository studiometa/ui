# Cursor <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Cursor/package.json';
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'Twig', 'JS'];

  const story = {
    src: './story.html',
    name:'Cursor',
    files: [
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
    ]
  };
</script>

<Story v-bind="story" />

## Parameters

### `attr`

- Type: `array`

Custom attributes for the root element.

## Blocks

### `content`

Custom content for the root element, defaults to `''`.
