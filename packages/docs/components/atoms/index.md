# Atoms

Atoms are components which offers a robust base to compose bigger components.

<script setup>
  import { ref } from 'vue';

  const mod = ref(import.meta.glob('./*/index.md', { eager: true }));
</script>

## Table of content

<Suspense>
  <Toc :modules="mod" />
</Suspense>
