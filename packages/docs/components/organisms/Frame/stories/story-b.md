---
layout: none
---

<script setup>
  import { onMounted } from 'vue';
  import PageB from './b.html?raw';

  onMounted(async () => {
    const { default: useApp } = await import('./app.js');
    useApp().then(app => app.$update());
  });

</script>

<div v-html="PageB" />
