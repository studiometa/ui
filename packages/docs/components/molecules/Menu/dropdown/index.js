import appJsRaw from './app.js?raw';
import AppTwigRaw from './app.twig?raw';

export default {
  src: './dropdown/story.html',
  name: 'Dropdown',
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
