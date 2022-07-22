<script setup lang="ts">
  import { ref, unref, computed } from 'vue';
  import {
    KBarProvider,
    KBarPortal,
    KBarPositioner,
    KBarAnimator,
    KBarSearch,
    defineAction,
  } from '@bytebase/vue-kbar';
  import { useRouter, useRoute } from 'vitepress';
  import { useAllLinks } from '../composables/useAllLinks.js';
  import SearchResults from './SearchResults.vue';

  const router = useRouter();
  const { links } = useAllLinks();

  const actions = computed(() => {
    return unref(links)
      .map((link) =>
        defineAction({
          id: link.link,
          name: [link.text, link.parent?.text ?? '', link.root?.text ?? ''].join(' '),
          link,
          section: link.parent
            ? link.root
              ? [link.root.text, link.parent.text].join(' → ')
              : link.parent.text
            : link.link.startsWith('/')
            ? 'Documentation'
            : 'External',
          perform: link.link.startsWith('/')
            ? async () => {
                await router.go(link.link);
                const activeSidebarLink = document.querySelector('.sidebar-link-item.active');
                if (activeSidebarLink && typeof activeSidebarLink.scrollIntoView === 'function') {
                  activeSidebarLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            : () => (window.location.href = link.link),
        })
      );
  });
  console.log(actions);
</script>

<template>
  <KBarProvider :actions="actions" :options="{ placeholder: 'Search docs' }">
    <ClientOnly>
      <KBarPortal>
        <KBarPositioner class="z-goku">
          <div class="z-under absolute inset-0 bg-vp-text-1 dark:bg-vp-bg-soft opacity-80"></div>
          <KBarAnimator
            class="flex flex-col w-full h-full max-w-lg max-h-lg bg-vp-bg shadow-lg rounded-lg overflow-hidden"
          >
            <KBarSearch class="p-4 text-lg w-full box-border outline-none border-none" />
            <SearchResults />
            <!-- see below -->
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
    </ClientOnly>

    <!-- you application entrance here -->
    <slot />
  </KBarProvider>
</template>
