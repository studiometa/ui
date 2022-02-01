<script setup lang="ts">
  import { ref, useEffect, onMounted, onUnmounted, getCurrentInstance, nextTick } from 'vue';
  import { fetchRenderedTwig } from '../utils/index.js';

  const props = defineProps({
    path: String,
  });

  const emit = defineEmits(['rendered']);

  const code = ref(null);
  const content = ref(null);
  const controller = new AbortController();

  onUnmounted(() => controller.abort());

  onMounted(() => {
    const { slots, ctx } = getCurrentInstance();
    const params = { ...ctx.$attrs };

    if (typeof slots.default === 'function') {
      const [renderedSlot] = slots.default();
      params.tpl = renderedSlot.children;
    }

    fetchRenderedTwig(props.path ?? '', params, controller).then((response) => {
      content.value = response;
      nextTick(() => emit('rendered'));
    });
  });
</script>

<template>
  <div v-html="content ?? ''" />
</template>
