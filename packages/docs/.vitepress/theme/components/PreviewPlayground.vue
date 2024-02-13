<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { withBase, useData } from 'vitepress';
  import { isFunction, isString } from '@studiometa/js-toolkit/utils';
  import { zip } from '@studiometa/ui-shared';
  import Loader from './Loader.vue';
  import ControlButton from './PreviewControlButton.vue';
  import useObserver from '../composables/useObserver.js';

  const props = defineProps({
    script: [String, Function],
    html: [String, Function],
    css: [String, Function],
    height: {
      type: String,
      default: '60vh',
    },
    zoom: {
      type: [Number, String],
      default: 1,
    },
    noControls: Boolean,
  });

  const { isDark } = useData();

  const script = ref('');
  if (isFunction(props.script)) {
    props.script().then((mod) => {
      script.value = zip(mod.default);
    });
  } else if (isString(props.script)) {
    script.value = zip(props.script);
  }

  const html = ref('');
  if (isFunction(props.html)) {
    props.html().then((mod) => {
      html.value = zip(mod.default);
    });
  } else if (isString(props.html)) {
    html.value = zip(props.html);
  }

  const css = ref('');
  if (isFunction(props.css)) {
    props.css().then((mod) => {
      css.value = zip(mod.default);
    });
  } else if (isString(props.css)) {
    css.value = zip(props.css);
  }

  const src = computed(() => {
    const url = new URL(import.meta.env.DEV ? '/-/play/index.html' : '/-/play/', 'http://localhost');
    if (html.value) {
      url.searchParams.set('html', html.value);
      url.searchParams.set('html-editor', 'true');
    } else {
      url.searchParams.set('html-editor', 'false');
    }

    if (script.value) {
      url.searchParams.set('script', script.value);
      url.searchParams.set('script-editor', 'true');
    } else {
      url.searchParams.set('script-editor', 'false');
    }

    if (css.value) {
      url.searchParams.set('style', css.value);
      url.searchParams.set('style-editor', 'true');
    } else {
      url.searchParams.set('style-editor', 'false');
    }

    url.searchParams.set('theme', isDark.value ? 'dark' : 'light');

    const newUrl = new URL(url);
    // Move URL search params to hash
    newUrl.hash = newUrl.searchParams.toString();
    newUrl.search = '';

    return newUrl.toString().replace(newUrl.origin, '');
  });

  const isLoading = ref(true);
  const iframe = ref();
  const scale = ref(Number(props.zoom));
  const iframeKey = ref(script.value + html.value);
  const withControls = computed(() => !props.noControls);

  watch(isDark, (newValue) => {
    const theme = newValue ? 'dark' : 'light';
    iframe.value.contentDocument.querySelector(`#theme-${theme}`)?.click();
  })

  function reloadIframe() {
    isLoading.value = true;
    iframeKey.value = script.value + html.value + performance.now();
  }

  /**
   * Change the iframe zoom.
   * @param {number} value The iframe zoom value.
   */
  function setIframeZoom(value: number) {
    scale.value = value;
  }

  function onLoad() {
    isLoading.value = false;
  }
</script>

<template>
  <div class="story">
    <div
      class="z-above relative my-4 bg-vp-bg-soft ring-2 ring-vp-c-gutter rounded-md overflow-hidden resize-x"
      :style="{ height }"
    >
      <div class="z-above absolute flex gap-1 top-0 left-0 p-2">
        <slot name="controls-top-left" />
      </div>
      <div v-if="withControls" class="z-above absolute flex gap-1 bottom-0 left-0 p-2">
        <slot name="controls-top-right" />
        <ControlButton @click="setIframeZoom(scale * 1.1)" title="Zoom in">
          <span class="sr-only">Zoom in</span>
          <i-octicon-plus-circle-16 class="block w-4 h-4" />
        </ControlButton>
        <ControlButton @click="setIframeZoom(scale * 0.9)" title="Zoom out">
          <span class="sr-only">Zoom out</span>
          <svg
            width="16"
            height="16"
            class="block w-4 h-4"
            viewBox="0 0 16 16"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.5 8C1.5 6.27609 2.18482 4.62279 3.40381 3.40381C4.62279 2.18482 6.27609 1.5 8 1.5C9.72391 1.5 11.3772 2.18482 12.5962 3.40381C13.8152 4.62279 14.5 6.27609 14.5 8C14.5 9.72391 13.8152 11.3772 12.5962 12.5962C11.3772 13.8152 9.72391 14.5 8 14.5C6.27609 14.5 4.62279 13.8152 3.40381 12.5962C2.18482 11.3772 1.5 9.72391 1.5 8ZM8 0C5.87827 0 3.84344 0.842855 2.34315 2.34315C0.842855 3.84344 0 5.87827 0 8C0 10.1217 0.842855 12.1566 2.34315 13.6569C3.84344 15.1571 5.87827 16 8 16C10.1217 16 12.1566 15.1571 13.6569 13.6569C15.1571 12.1566 16 10.1217 16 8C16 5.87827 15.1571 3.84344 13.6569 2.34315C12.1566 0.842855 10.1217 0 8 0ZM4.75 7.25C4.55109 7.25 4.36032 7.32902 4.21967 7.46967C4.07902 7.61032 4 7.80109 4 8C4 8.19891 4.07902 8.38968 4.21967 8.53033C4.36032 8.67098 4.55109 8.75 4.75 8.75C8.91901 8.75 7.54171 8.75 11.25 8.75C11.4489 8.75 11.6397 8.67098 11.7803 8.53033C11.921 8.38968 12 8.19891 12 8C12 7.80109 11.921 7.61032 11.7803 7.46967C11.6397 7.32902 11.4489 7.25 11.25 7.25C7.54231 7.25 8.91825 7.25 4.75 7.25Z"
            />
          </svg>
        </ControlButton>
        <ControlButton @click="setIframeZoom(Number(zoom))" title="Reset zoom">
          <span class="sr-only">Reset zoom</span>
          <i-octicon-x-circle-16 class="block w-4 h-4" />
        </ControlButton>
        <ControlButton :href="src" target="_blank" rel="noopener" title="Open in a new window">
          <span class="sr-only">Open in a new window</span>
          <i-octicon-link-external-16 class="block w-4 h-4" />
        </ControlButton>
        <ControlButton @click="reloadIframe" title="Reload iframe">
          <span class="sr-only">Reload iframe</span>
          <i-octicon-sync-16 class="block w-4 h-4" />
        </ControlButton>
      </div>
      <Loader v-if="isLoading" />
      <iframe
        ref="iframe"
        :key="iframeKey"
        @load="onLoad"
        class="block border-0 transform origin-top-left duration-300"
        :class="{ 'opacity-0': isLoading }"
        :src="src"
        width="100%"
        :style="{
          '--scale': scale,
          '--tw-scale-x': 'var(--scale)',
          '--tw-scale-y': 'var(--scale)',
          width: `calc(1 / var(--scale) * 100%)`,
          height: `calc(1 / var(--scale) * ${height})`,
        }"
      />
    </div>
  </div>
</template>
