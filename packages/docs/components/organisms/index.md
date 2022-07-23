# Organisms


Organisms are either advanced and composable components which offers complex functionnality or ready-to-use sections.

<script setup>
  import { ref } from 'vue';

  const mod = ref(import.meta.glob('./*/index.md', { eager: true }));
</script>

## Table of content

<Suspense>
  <Toc :modules="mod" />
</Suspense>
