# Panel <Badges :texts="badges" />

<script setup>
  import { ref, onMounted } from 'vue';
  import pkg from '@studiometa/ui/molecules/Panel/package.json';
  import appJsRaw from './app.js?raw';

  const badges = [`v${pkg.version}`, 'Twig', 'JS'];

  async function createStory(name, variant) {
    const { default: tpl } = await import(`./app-${variant}.twig`);
    return {
      name,
      src: `./story-${variant}.html`,
      files: [
        {
          label: 'app.twig',
          lang: 'twig',
          content: tpl,
        },
        {
          label: 'app.js',
          lang: 'js',
          content: appJsRaw,
        }
      ]
    }
  }

  const stories = ref([]);
  onMounted(() => {
    Promise.all([
      createStory('Top', 'top'),
      createStory('Right', 'right'),
      createStory('Bottom', 'bottom'),
      createStory('Left', 'left'),
    ]).then((results) => {
      stories.value = results
    });
  });
</script>

<Stories :key="stories.length" :stories="stories" />

## Parameters

All parameters from the [`Modal` component](/components/molecules/Modal/#parameters) are inherited.

### `position`

- Type: `'top'|'right'|'bottom'|'left'`

Define the position of the panel in the page, defaults to `'left'`.

## Blocks

### `open`

Customize the open trigger button.

### `close`

Customize the close trigger button.

### `content`

Set the modal's content.
