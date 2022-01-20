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

<PreviewIframe class="block-full-width" src="./story.html" />

<Tabs :items="tabs" />
