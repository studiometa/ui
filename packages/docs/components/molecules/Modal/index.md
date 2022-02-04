# Modal <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Modal/package.json';
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'Twig', 'JS'];

  const files = [
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    },
    {
      label: 'app.js',
      lang: 'js',
      content: appJsRaw,
    }
  ];
</script>

<Story src="./story.html" :files="files" />

## Parameters

- `$attr` (`array`): Customize the root element attributes.
- `$modal_attr` (`array`): Customize the modal element attributes.
- `$overlay_attr` (`array`): Customize the overlay element attributes.
- `$wrapper_atrr` (`array`): Customize the wrapper element attributes.
- `$container_atrr` (`array`): Customize the container element attributes.
- `$content_atrr` (`array`): Customize the content element attributes.

## Blocks

### `open`

Customize the open trigger button.

### `close`

Customize the close trigger button.

### `content`

Set the modal's content.

