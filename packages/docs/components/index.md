# Components

<script setup>
  import { useData, withBase } from 'vitepress';
  const { theme: { value: {sidebar } } } = useData();

  const components = sidebar['/components/'];
</script>

<template v-for="type in components" :key="type.link">
  <h2><a class :href="withBase(type.link)">{{ type.text }}</a></h2>
  <ul v-if="type.children">
    <li v-for="child in type.children" :key="child.link">
      <a :href="withBase(child.link)">{{ child.text }}</a>
    </li>
  </ul>
</template>
