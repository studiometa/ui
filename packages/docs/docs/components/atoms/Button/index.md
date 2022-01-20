# Button <Badges texts="Twig" />

<script setup>
  import AppTwigRaw from './app.twig?raw';

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
