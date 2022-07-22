---
layout: none
---

<script setup>
  import { onMounted } from 'vue';
  onMounted(() => document.body.style.padding = '0');
</script>

<RenderTwig :js-importer="() => import('./app.js')" :tpl-importer="() => import('./app.twig?raw')" />
