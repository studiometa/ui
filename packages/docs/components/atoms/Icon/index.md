# Icon <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Icon/package.json';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'Twig'];

  const files = [
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    }
  ];
</script>

<Story src="./story.html" :files="files" />
