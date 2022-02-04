<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import ControlButton from './PreviewControlButton.vue';
  import ControlSelect from './PreviewControlSelect.vue';
  import { Story } from '../types.d.ts';

  const { stories, height } = withDefaults(
    defineProps<{
      stories: Story[];
      height?: string;
    }>(),
    { height: '80vh' }
  );

  const withCode = ref(true);
  const selectedStoryIndex = ref(0);
  const story = computed(() => stories[selectedStoryIndex.value]);
</script>

<template>
  <div class="block-full-width my-6 mb-12 flex items-stretch bg-gray-100" :style="{ height }">
    <div class="w-2/5 bg-code-bg" v-show="withCode">
      <Tabs v-if="story" :key="story.src" :items="story.files" class="h-full" />
    </div>
    <div class="w-3/5 flex-grow">
      <PreviewIframe v-if="story" :key="story.src" :src="story.src" class="h-full" height="100%">
        <template #controls-top-left>
          <ControlButton @click="withCode = !withCode" title="Toggle code">
            <span class="sr-only">Toggle code</span>
            <i-octicon-code-16 class="block w-4 h-4" />
          </ControlButton>
          <ControlSelect
            v-if="stories.length > 1"
            :items="stories"
            v-model="selectedStoryIndex"
            title="Select variant"
          >
            <template #option="{ item }">
              {{ item.name ?? item.src }}
            </template>
          </ControlSelect>
        </template>
      </PreviewIframe>
    </div>
  </div>
</template>
