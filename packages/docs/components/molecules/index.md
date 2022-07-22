# Molecules

Molecules are components with a more complete structure, often made of atoms or other molecules.

<script setup>
  import { ref } from 'vue';

  const mod = ref(import.meta.glob('./*/index.md', { eager: true }));
</script>

## Table of content

<Suspense>
  <Toc :modules="mod" />
</Suspense>
