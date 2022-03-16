# LargeText <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/LargeText/package.json';
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'JS', 'Twig'];

  const story = {
    src: './story.html',
    name: 'LargeText',
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
