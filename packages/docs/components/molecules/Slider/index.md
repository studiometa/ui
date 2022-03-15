# Slider <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Slider/package.json';
  import appJsRaw from './app.js?raw';
  import SliderJsRaw from './Slider.js?raw';
  import AppTwigRaw from './app.twig?raw';

  const badges = [`v${pkg.version}`, 'JS'];

  const files = [
    {
      label: 'app.js',
      lang: 'js',
      content: appJsRaw,
    },
    {
      label: 'Slider.js',
      lang: 'js',
      content: SliderJsRaw,
    },
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    }
  ];
</script>

<Story src="./story.html" :files="files" />
