<script setup>
  import { watch } from 'vue';
  import { useData } from 'vitepress';
  import Theme from 'vitepress/theme';

  const { Layout } = Theme;
  const { frontmatter } = useData();
</script>

<template>
  <Content v-if="frontmatter.layout === 'none'" />
  <Layout v-else />
</template>
