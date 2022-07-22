---
layout: none
---

<RenderTwig :js-importer="() => import('./app.js')" :tpl-importer="() => import('./app.twig?raw')" />

<script>
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';

  export const story = {
    src: './FigureTwicPics/story.html',
    name: 'FigureTwicPics',
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
