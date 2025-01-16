# Components

<script setup>
  const mods = import.meta.glob(`./*/index.md`, { eager: true });
</script>

<Suspense>
  <Toc :modules="mods" as-table :headers="['Component','Badges']" />
</Suspense>
