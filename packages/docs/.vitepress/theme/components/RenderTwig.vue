<script setup lang="ts">
  import { ref, useEffect, onMounted, onUnmounted, getCurrentInstance, nextTick } from 'vue';
  import { fetchRenderedTwig } from '../utils/index.js';

  const emit = defineEmits(['rendered']);
  const props = defineProps<{
    path?:string;
    tplImporter?:() => Promise<string>;
    jsImporter?: () => Promise<any>;
  }>();

  const code = ref(null);
  const content = ref(null);
  const controller = new AbortController();

  onUnmounted(() => controller.abort());

  onMounted(async () => {
    const { slots, ctx } = getCurrentInstance();
    const params = { ...ctx.$attrs };

    // This is a story
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('story');
    }

    // Import template from importer
    if (props.tplImporter) {
      const { default: tpl } = await props.tplImporter();
      params.tpl = tpl;
    } else if (typeof slots.default === 'function') {
      const [renderedSlot] = slots.default();
      params.tpl = renderedSlot.children;
    } else if (!params.tpl) {
      throw new Error('The `tpl` is not defined. Use the `tplImporter` prop or the default slot.');
    }

    function fetchContent() {
      fetchRenderedTwig(params, controller).then((response) => {
        content.value = response;

        nextTick(async () => {
          emit('rendered');
          if (props.jsImporter) {
            const { default: useApp } = await props.jsImporter();
            const app = await useApp();
            app.$update();
          }
        });
      }).catch((error) => {
        if (!error.message.includes('aborted')) {
          content.value = error.toString();
        }
      });
    }

    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => {
        fetchContent();
      });
    }

    fetchContent();
  });
</script>

<template>
  <div v-html="content ?? ''" />
</template>
