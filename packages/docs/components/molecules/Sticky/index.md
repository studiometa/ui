# Sticky <Badges texts="Twig,JS" />

<script setup>
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';

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
