<script setup>
  import Badge from './Badge.vue';

  const { type, texts, vertical } = defineProps({
    type: {
      type: String,
      default: 'tip',
    },
    texts: {
      type: [Array,String],
      default: [],
    },
    vertical: {
      type: String,
      default: 'middle',
    },
  });

  const normalizedTexts = (Array.isArray(texts) ? texts : texts.split(',')).toSorted();
</script>

<template>
  <Badge v-for="text in normalizedTexts" :key="text" v-bind="{ type, vertical }">
    {{ text }}
  </Badge>
</template>
