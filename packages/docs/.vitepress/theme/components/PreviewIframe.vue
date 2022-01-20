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
</script>

<template>
  <div class="relative my-4 rounded bg-gray-100 overflow-hidden resize-x">
    <div class="absolute top-0 right-0 p-2">
      <ControlButton :href="src" target="_blank" rel="noopener">
        <span class="sr-only">Open in a new window</span>
        <svg class="block" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83l1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" fill="currentColor"/></svg>
      </ControlButton>
    </div>
    <Loader v-if="isLoading" />
    <iframe
      @load="isLoading = false"
      class="block border-0 bg-gray-100 transition duration-300"
      :class="{ 'opacity-0': isLoading }"
      :src="src"
      width="100%"
      :style="{ height }"
    />
  </div>
</template>
