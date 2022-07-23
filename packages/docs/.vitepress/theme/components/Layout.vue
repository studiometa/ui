<script setup>
  import { watch } from 'vue';
  import { useData } from 'vitepress';
  import Search from './Search.vue';
  import App from './App.vue';

  const { frontmatter } = useData();
</script>

<template>
  <Content v-if="frontmatter.layout === 'none'" />
  <Search v-else>
    <App />
  </Search>
</template>
