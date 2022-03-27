import appJsRaw from './app.js?raw';
import AppTwigRaw from './app.twig?raw';

export default {
  src: new URL('./story.html', import.meta.url).pathname,
  name: 'MegaMenu',
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
