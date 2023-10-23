---
title: Menu examples
---

# Examples

## Burger menu

<PreviewIframe src="./stories/burger/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js', 'Menu.js', 'MenuList.js']">
  <template #content-1>

<<< ./stories/burger/app.twig

  </template>
  <template #content-2>

<<< ./stories/burger/app.js

  </template>
  <template #content-3>

<<< ./stories/burger/Menu.js

  </template>
  <template #content-4>

<<< ./stories/burger/MenuList.js

  </template>
</SimpleTabs>

:::

## Dropdown

<PreviewIframe src="./stories/dropdown/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js']">
  <template #content-1>

<<< ./stories/dropdown/app.twig

  </template>
  <template #content-2>

<<< ./stories/dropdown/app.js

  </template>
</SimpleTabs>

:::

## Mega menu

<PreviewIframe src="./stories/mega-menu/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js']">
  <template #content-1>

<<< ./stories/mega-menu/app.twig

  </template>
  <template #content-2>

<<< ./stories/mega-menu/app.js

  </template>
</SimpleTabs>

:::

## Responsive mega menu

Switch from a mega menu on desktop to a burger menu on mobile.

<PreviewIframe src="./stories/mega-menu-responsive/story.html" />

:::details Code

<SimpleTabs :items="['app.twig', 'app.js', 'Menu.js']">
  <template #content-1>

<<< ./stories/mega-menu-responsive/app.twig

  </template>
  <template #content-2>

<<< ./stories/mega-menu-responsive/app.js

  </template>
  <template #content-3>

<<< ./stories/mega-menu-responsive/Menu.js

  </template>
</SimpleTabs>

:::
