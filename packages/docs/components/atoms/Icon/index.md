# Icon <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Icon/package.json';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'Twig'];

  const tabs = [
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    }
  ];
</script>

<PreviewIframe class="block-full-width" height="400px" src="./story.html" />

<Tabs :items="tabs" />
