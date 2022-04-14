---
sidebar: false
navbar: false
customLayout: true
---

<script setup>
  import { onMounted } from 'vue';
  import PageA from './story/a.html?raw';

  onMounted(async () => {
    const { default: useApp } = await import('./app.js');
    useApp().then(app => app.$update());
  });

</script>

<div v-html="PageA" />
