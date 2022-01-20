---
sidebar: false
navbar: false
customLayout: true
---

<script setup>
  import { ref, onMounted } from 'vue';
  import AppTwigRaw from './app.twig?raw';

  if (typeof window !== 'undefined') {
    document.documentElement.classList.add('story');
  }

  async function updateApp() {
    if (typeof window === 'undefined') {
      return;
    }

    const { default: useApp } = await import('./app.js');
    const app = await useApp();
    app.$update();
  }
</script>

<RenderTwig @rendered="updateApp">{{ AppTwigRaw }}</RenderTwig>
