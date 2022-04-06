# ScrollAnimation <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/ScrollAnimation/package.json';
  import appJsRaw from './app.js?raw';
  import AppTwigRaw from './app.twig?raw';
  import AppParentJsRaw from './app-parent.js?raw';
  import ScrollAnimationParentRaw from './ScrollAnimationParent.js?raw';
  import AppParentTwigRaw from './app-parent.twig?raw';

  const badges = [`v${pkg.version}`, 'JS'];

  const stories = [
    {
      src: './story.html',
      name: 'ScrollAnimation',
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
    },
    {
      src: './story-parent.html',
      name: 'ScrollAnimationParent',
      files: [
        {
          label: 'app.js',
          lang: 'js',
          content: AppParentJsRaw,
        },
        {
          label: 'ScrollAnimationParent.js',
          lang: 'js',
          content: ScrollAnimationParentRaw,
        },
        {
          label: 'app.twig',
          lang: 'twig',
          content: AppParentTwigRaw,
        }
      ]
    }
  ];
</script>

<Stories :stories="stories" />
