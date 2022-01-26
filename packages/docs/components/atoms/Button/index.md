# Button <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/Button/package.json';
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

<PreviewIframe class="block-full-width" src="./story.html" />

<Tabs :items="tabs" />
