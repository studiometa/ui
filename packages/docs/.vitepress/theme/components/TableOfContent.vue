<script setup>
  import { normalizeLink } from 'vitepress/dist/client/theme-default/support/utils.js';

  const props = defineProps({
    modules: Object,
  });

  const links = Object.values(props.modules).map((md) => md.__pageData);
</script>

<template>
  <ul v-for="link in links" :key="link.relativePath">
    <li>
      <a :href="normalizeLink(link.relativePath)">
        {{ link.title }}
      </a>&nbsp;
      <Badges v-if="link?.frontmatter?.badges" :texts="link.frontmatter.badges" />
    </li>
  </ul>
</template>
