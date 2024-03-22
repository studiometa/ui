# Components

<script setup>
  import { useData, withBase } from 'vitepress';
  const { theme: { value: {sidebar } } } = useData();

  const components = sidebar['/components/'];
  const categories = import.meta.glob('./*/index.md', { eager: true });
  const mod = import.meta.glob(`./*/*/index.md`, { eager: true });

  const sections = Object.values(categories).map((md) => {
    const { title, relativePath } = md.__pageData;
    const sectionPath = relativePath.replace(/\/index\.md$/, '/');
    const components = Object.fromEntries(Object.entries(mod).filter(([,{ __pageData }]) => {
      return __pageData.filePath.startsWith(sectionPath)
    }));

    return {
      title,
      href: `/${sectionPath}`,
      components,
    }
  });
</script>

Components are grouped following the [Atomic Design principles](https://bradfrost.com/blog/post/atomic-web-design/) with an extra `Primitives` group containing components that are not directly usable but should be used to create other components.

<template v-for="section in sections">

## <a :href="withBase(section.href)">{{ section.title }}</a>

  <Suspense>
    <Toc :modules="section.components" />
  </Suspense>

</template>
