<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { inBrowser, useData } from 'vitepress';
  import { isFunction, isString } from '@studiometa/js-toolkit/utils';

  if (inBrowser) {
    import('@studiometa/playground-preview');
  }

  type CodeProp = string | (() => Promise<{ default: string }>);

  interface Props {
    script?: CodeProp;
    html?: CodeProp;
    css?: CodeProp;
    height?: string;
    zoom?: string | number;
    noControls?: boolean;
    header?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    height: '60vh',
    zoom: 0.9,
  });

  const { isDark } = useData();

  function useCode(codeProp?: CodeProp) {
    const code = ref('');
    const isLoading = ref(false);

    if (isFunction(codeProp)) {
      isLoading.value = true;
      codeProp().then((mod) => {
        code.value = mod.default;
        isLoading.value = false;
      });
    } else if (isString(codeProp)) {
      code.value = codeProp;
    }

    return { code, isLoading };
  }

  const { code: htmlCode, isLoading: htmlLoading } = useCode(props.html);
  const { code: scriptCode, isLoading: scriptLoading } = useCode(props.script);
  const { code: cssCode, isLoading: cssLoading } = useCode(props.css);

  const isReady = computed(
    () => !htmlLoading.value && !scriptLoading.value && !cssLoading.value,
  );

  const theme = computed(() => (isDark.value ? 'dark' : 'light'));

  const baseUrl = import.meta.env.DEV ? '/play/index.html' : '/play/';

  // Use theme as part of the key to force a full re-create of the web component
  // when the theme changes. This is needed because the playground iframe URL uses
  // hash parameters, and browsers don't fire a `load` event when only the hash changes.
  const key = computed(() => theme.value);
</script>

<template>
  <div class="story">
    <playground-preview
      v-if="isReady"
      :key="key"
      :base-url="baseUrl"
      :height="height"
      :zoom="String(zoom)"
      :header="header"
      :no-controls="noControls || undefined"
      :theme="theme"
      :html="htmlCode"
      :script="scriptCode"
      :css="cssCode || undefined"
    />
  </div>
</template>
