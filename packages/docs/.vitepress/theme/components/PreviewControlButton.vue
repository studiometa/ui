<script setup>
  import { computed, useAttrs } from 'vue';

  const attrs = useAttrs();
  const tag = computed(() => attrs.href ? 'a' : 'button');
</script>

<template>
  <component :is="tag" class="inline-block p-2 rounded bg-brand text-white">
    <slot />
  </component>
</template>
