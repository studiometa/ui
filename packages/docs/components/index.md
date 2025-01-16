# Components

<script setup>
  import { useData, withBase } from 'vitepress';
  const { theme: { value: {sidebar } } } = useData();

  const components = sidebar['/components/'];
  const mods = import.meta.glob(`./*/index.md`, { eager: true });
</script>

<Suspense>
  <Toc :modules="mods" as-table :headers="['Component','Badges']" />
</Suspense>

