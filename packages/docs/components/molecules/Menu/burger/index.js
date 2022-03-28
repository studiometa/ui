import appJsRaw from './app.js?raw';
import AppTwigRaw from './app.twig?raw';
import MenuJsRaw from './Menu.js?raw';
import MenuItemsJsRaw from './MenuItems.js?raw';

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
      label: 'MenuItems.js',
      lang: 'js',
      content: MenuItemsJsRaw,
    },
    {
      label: 'app.twig',
      lang: 'twig',
      content: AppTwigRaw,
    },
  ],
};
