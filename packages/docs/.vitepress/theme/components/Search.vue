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
  import { useAllLinks } from '../composables/useAllLinks.ts';
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
</script>

<template>
  <KBarProvider :actions="actions" :options="{ placeholder: 'Search docs' }">
    <ClientOnly>
      <KBarPortal>
        <KBarPositioner class="z-goku bg-gray-300 bg-opacity-80">
          <KBarAnimator
            class="bg-white shadow-lg rounded-lg w-full h-full max-w-lg max-h-lg overflow-hidden divide-y"
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
