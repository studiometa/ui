# ScrollReveal <Badges :texts="badges" />

<script setup>
  import pkg from '@studiometa/ui/atoms/ScrollReveal/package.json';
  import { story } from './ScrollReveal/story.md';

  const badges = [`v${pkg.version}`, 'JS'];

  const stories = [story];
</script>

<Stories :stories="stories" />
