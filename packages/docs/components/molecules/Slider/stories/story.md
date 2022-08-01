---
layout: none
---

<script setup>
  import { onMounted } from 'vue';
  onMounted(() => document.body.classList.add('overflow-x-hidden'));
</script>

<RenderTwig :js-importer="() => import('./app.js')" :tpl-importer="() => import('./app.twig?raw')" />
