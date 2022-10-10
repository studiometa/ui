---
layout: none
---

<script setup>
  import { onMounted } from 'vue';
  import PageB from './story-b.txt?raw';

  onMounted(async () => {
    const { default: useApp } = await import('./app.js');
    useApp().then(app => app.$update());

    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('story');
    }
  });

</script>

<div v-html="PageB" />
