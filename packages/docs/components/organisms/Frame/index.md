# Frame <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/organisms/Frame/package.json';
  import appJsRaw from './app.js?raw';
  import PageA from './story/a.html?raw';
  import PageB from './story/b.html?raw';

  const badges = [`v${pkg.version}`, 'JS'];

  const story = {
      name: 'Frame',
      src: './story.html',
      files: [
        {
          label: 'app.js',
          lang: 'js',
          content: appJsRaw,
        },
        {
          label: 'a.html',
          lang: 'html',
          content: PageA,
        },
        {
          label: 'b.html',
          lang: 'html',
          content: PageB,
        },
      ],
    };
</script>

<Stories :stories="[story]" />
