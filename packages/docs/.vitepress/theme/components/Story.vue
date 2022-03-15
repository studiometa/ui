<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import Stories from './Stories.vue';
  import { Story } from '../types.d.ts';

  const props = defineProps<{
    src: Story['src'];
    name?: Story['name'];
    files: Story['files'];
    height?: string;
  }>();

  const { height, ...story } = props;
</script>

<template>
  <Stories v-bind="{ stories: [story], height }" />
</template>
