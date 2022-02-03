---
sidebar: false
navbar: false
customLayout: true
---

<script setup>
  import AppTwigRaw from './app-secondary.twig?raw';

  if (typeof window !== 'undefined') {
    document.documentElement.classList.add('story');
  }
</script>

<RenderTwig>{{ AppTwigRaw }}</RenderTwig>
