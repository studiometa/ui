<script lang="ts" setup>
  import type { DefaultTheme } from 'vitepress/theme';
  import { inject, unref, computed } from 'vue';
  import { useData } from 'vitepress';
  import { isActive } from 'vitepress/client/theme-default/support/utils';
  import VPLink from 'vitepress/client/theme-default/components/VPLink.vue';

  const props = defineProps<{
    item: DefaultTheme.SidebarItem;
  }>();

  const { page } = useData();

  const closeSideBar = inject('close-sidebar') as () => void;

  const isParentActive = computed(() => {
    return (
      isActive(unref(page).relativePath, props.item.link) ||
      (Array.isArray(props.item.items) &&
        props.item.items.some((child) => isActive(unref(page).relativePath, child.link)))
    );
  });
</script>

<template>
  <VPLink
    :class="{ active: isParentActive, 'exact-active': isActive(page.relativePath, item.link) }"
    :href="item.link"
    @click="closeSideBar"
  >
    <span class="link-text">{{ item.text }}</span>
  </VPLink>
  <template
    v-if="isParentActive && Array.isArray(item.items) && item.items.length"
  >
    <div class="pl-4 border-l border-vp-c-divider-light" style="font-size: 0.9em;">
      <VPLink
        v-for="child in item.items"
        :class="{ 'exact-active': isActive(page.relativePath, child.link) }"
        :href="child.link"
        @click="closeSideBar"
      >
        <span class="link-text">{{ child.text }}</span>
      </VPLink>
    </div>
  </template>
</template>

<style scoped>
  .link {
    display: block;
    padding: 4px 0;
    color: var(--vp-c-text-2);
    transition: color 0.5s;
  }

  .link:hover {
    color: var(--vp-c-text-1);
  }

  .link.active {
    color: var(--vp-c-brand-dark);
  }

  .link.exact-active {
    color: var(--vp-c-brand);
  }

  .link :deep(.icon) {
    width: 12px;
    height: 12px;
    fill: currentColor;
  }

  .link-text {
    line-height: 20px;
    font-size: 0.875em;
    font-weight: 500;
  }
</style>
