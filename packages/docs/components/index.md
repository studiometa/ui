# Components

<script setup>
  import { useData, withBase } from 'vitepress';
  const { theme: { value: {sidebar } } } = useData();

  const components = sidebar['/components/'];
</script>

Components are grouped following the [Atomic Design principles](https://bradfrost.com/blog/post/atomic-web-design/) with an extra `Primitives` group containing components that are not directly usable but should be used to create other components.

<template v-for="type in components" :key="type.link">
  <template v-if="type.text === 'Primitives'">

## Primitives

  </template>
  <template v-if="type.text === 'Atoms'">

## Atoms

  </template>
  <template v-if="type.text === 'Molecules'">

## Molecules

  </template>
  <template v-if="type.text === 'Organisms'">

## Organisms

  </template>
  <ul v-if="type.items">
    <li v-for="child in type.items" :key="child.link">
      <a :href="withBase(child.link)">{{ child.text }}</a>
    </li>
  </ul>
</template>
