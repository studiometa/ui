---
badges: [JS]
---

# ClickOutside <Badges :texts="$frontmatter.badges" />

The `ClickOutside` primitive dispatches a native `click-outside` event on its element whenever the user clicks anywhere outside of it.

## Usage

`ClickOutside` defines no behaviour of its own beyond emitting the event, so it is meant to be paired with the [`Action`](/components/Action/index.html) component on the same element. Add both components to an element and listen to the emitted event with the [`on:<event>` option](/components/Action/js-api.html#on-event-modifier): `data-on:click-outside="..."`.

In the following example, a dropdown menu is toggled by a button and closes as soon as a click lands outside of it.

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/dropdown/app.twig')"
  :script="() => import('./stories/dropdown/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/dropdown/app.twig
<<< ./stories/dropdown/app.js

:::

</llm-only>
