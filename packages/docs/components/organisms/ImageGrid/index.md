# ImageGrid <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/organisms/ImageGrid/package.json';
  import appJsRaw from './app.js?raw';
  import AppFiveImagesTwigRaw from './app-5-images.twig?raw';
  import AppThreeImagesTwigRaw from './app-3-images.twig?raw';

  const badges = [`v${pkg.version}`, 'Twig'];

  const stories = [
    {
      name: '5 images',
      src: './story-5-images.html',
      files: [
        {
          label: 'app.twig',
          lang: 'twig',
          content: AppFiveImagesTwigRaw,
        },
        {
          label: 'app.js',
          lang: 'js',
          content: appJsRaw,
        },
      ],
    },
    {
      name: '3 images',
      src: './story-3-images.html',
      files: [
        {
          label: 'app.twig',
          lang: 'twig',
          content: AppThreeImagesTwigRaw,
        },
        {
          label: 'app.js',
          lang: 'js',
          content: appJsRaw,
        },
      ],
    },
  ];
</script>

<Stories :stories="stories" />
