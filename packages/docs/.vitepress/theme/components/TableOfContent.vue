<script setup>
  import { normalizeLink } from 'vitepress/dist/client/theme-default/support/utils.js';

  const props = defineProps({
    modules: Object,
    asTable: Boolean,
    headers: Array,
  });

  const links = Object.values(props.modules).map((md) => md.__pageData);
</script>

<template>
  <template v-if="asTable">
    <table class="w-full">
      <thead v-if="headers">
        <tr>
          <th v-for="header in headers">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="link in links" :key="link.relativePath">
          <td>
            <a :href="normalizeLink(link.relativePath)">{{ link.title }}</a>
          </td>
          <td>
            <Badges v-if="link?.frontmatter?.badges" :texts="link.frontmatter.badges" />
          </td>
        </tr>
      </tbody>
    </table>
  </template>
  <template v-else>
    <ul v-for="link in links" :key="link.relativePath">
      <li>
        <a :href="normalizeLink(link.relativePath)">
          {{ link.title }}
        </a>&nbsp;
        <Badges v-if="link?.frontmatter?.badges" :texts="link.frontmatter.badges" />
      </li>
    </ul>
  </template>
</template>
