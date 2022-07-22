# Primitives


Primitives are low-level pieces of JavaScript, HTML or Twig that can be used to easily build custom UI components.

<script setup>
  import { ref } from 'vue';

  const mod = ref(import.meta.glob('./*/index.md', { eager: true }));
</script>

## Table of content

<Suspense>
  <Toc :modules="mod" />
</Suspense>
