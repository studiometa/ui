<script setup lang="ts">
  import { ref } from 'vue';
  import Loader from './Loader.vue';
  import ControlButton from './PreviewControlButton.vue';

  const { src, height } = defineProps({
    src: String,
    height: {
      type: String,
      default: '60vh',
    },
  });

  const isLoading = ref(true);
  const iframeKey = ref(performance.now())

  function reloadIframe() {
    isLoading.value = true;
    iframeKey.value = performance.now();
  }
</script>

<template>
  <div class="relative my-4 rounded bg-gray-100 overflow-hidden resize-x">
    <div class="z-above absolute flex gap-1 top-0 right-0 p-2">
      <ControlButton :href="src" target="_blank" rel="noopener">
        <span class="sr-only">Open in a new window</span>
        <i-octicon-link-external-16 class="block w-4 h-4" />
      </ControlButton>
      <ControlButton @click="reloadIframe" target="_blank" rel="noopener">
        <span class="sr-only">Reload iframe</span>
        <i-octicon-sync-16 class="block w-4 h-4" />
      </ControlButton>
    </div>
    <Loader v-if="isLoading" />
    <iframe
      :key="iframeKey"
      @load="isLoading = false"
      class="block border-0 bg-gray-100 transition duration-300"
      :class="{ 'opacity-0': isLoading }"
      :src="src"
      width="100%"
      :style="{ height }"
    />
  </div>
</template>
