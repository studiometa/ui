# Menu <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/molecules/Menu/package.json';
  import burger from './burger/index.js';
  import dropdown from './dropdown/index.js';
  import megaMenu from './mega-menu/index.js';

  const badges = [`v${pkg.version}`, 'JS'];

  const stories = [
    burger,
    dropdown,
    megaMenu,
  ];
</script>

<Stories :stories="stories" />
