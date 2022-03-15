# Figure <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Figure/package.json';
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'Twig', 'JS'];

  const story = {
    src: './story.html',
    name: 'Figure',
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
      },
    ],
  };
</script>

<Story v-bind="story" />

## Parameters

### `src`

- Type: `string`

### `srcset`

- Type: `string`

### `sizes`

- Type: `string`

### `width`

- Type: `number`

### `height`

- Type: `number`

### `alt`

- Type: `string`

### `caption`

- Type: `string`

### `fit`

- Type: `'cover'|'contain'|'fill'|'none'`

Define how the image will fit.

### `absolute`

- Type: `boolean`

Use absolute position on the image holder instead of relative.

### `inline`

- Type: `boolean`

Wether to enable the display of the figure inline or not. When `inline`, the root element will have a max-width set corresponding to the `width` given. Use with caution.

### `attr`

- Type: `array`

Custom attributes for the root element.

### `inner_attr`

- Type: `array`

Custom attributes for the inner element.

### `img_attr`

- Type: `array`

Custom attributes for the image element.

### `caption_attr`

- Type: `array`

Custom attributes for the caption element.


## Blocks

### `caption`

Use this block to customize the image's caption, defaults to the [`caption` parameter](#caption).
