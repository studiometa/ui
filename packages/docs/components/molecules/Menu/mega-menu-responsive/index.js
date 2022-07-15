import appJsRaw from './app.js?raw';
import MenuJsRaw from './Menu.js?raw';
import AppTwigRaw from './app.twig?raw';

export default {
  src: './mega-menu-responsive/story.html',
  name: 'MegaMenu Responsive',
  files: [
    {
      label: 'app.js',
      lang: 'js',
      content: appJsRaw,
    },
    {
      label: 'Menu.js',
      lang: 'js',
      content: MenuJsRaw,
    },
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    },
  ],
};
