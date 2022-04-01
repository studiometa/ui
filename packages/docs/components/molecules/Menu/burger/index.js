import appJsRaw from './app.js?raw';
import AppTwigRaw from './app.twig?raw';
import MenuJsRaw from './Menu.js?raw';
import MenuListJsRaw from './MenuList.js?raw';

export default {
  src: './burger/story.html',
  name: 'Burger',
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
      label: 'MenuList.js',
      lang: 'js',
      content: MenuListJsRaw,
    },
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    },
  ],
};
