<script setup>
  import { normalizeLink } from 'vitepress/client/theme-default/support/utils.js';

  const props = defineProps({
    modules: Object,
  });

  const links = await Promise.all(
    Object.values(props.modules).map(async (md) => {
      const { __pageData, ...ctx } = await md();
      return __pageData;
    })
  );
</script>

<template>
  <ul v-for="link in links" :key="link.relativePath">
    <li>
      <a :href="normalizeLink(link.relativePath)">{{ link.title }}</a>
    </li>
  </ul>
</template>
