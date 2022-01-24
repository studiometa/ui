<script setup>
  import Badge from './Badge.vue';

  const { type, texts, vertical } = defineProps({
    type: {
      type: String,
      default: 'tip',
    },
    texts: String,
    vertical: {
      type: String,
      default: 'middle',
    },
  });
</script>

<template>
  <Badge v-for="text in texts.split(',')" :key="text" v-bind="{ type, vertical }">
    {{ text }}
  </Badge>
</template>
