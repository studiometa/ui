# Menu <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Menu/package.json';
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';
  import MenuJsRaw from './Menu.js?raw';
  import MenuItemsJsRaw from './MenuItems.js?raw';

  const badges = [`v${pkg.version}`, 'JS'];

  const files = [
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
    }
  ];
</script>

<Story src="./story.html" :files="files" />
