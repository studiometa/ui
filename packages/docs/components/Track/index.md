---
badges: [JS]
---

# Track <Badges :texts="$frontmatter.badges" />

The `Track` component provides declarative analytics tracking compatible with GTM/dataLayer, GA4, Segment, and custom backends. No custom JavaScript required - tracking is fully defined in HTML/Twig attributes.

## Table of content

- [Examples](./examples.md)
- [JS API](./js-api.md)

## Usage

Import the component and register it in your application:

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { Track, TrackContext } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      Track,
      TrackContext,
    },
  };
}

createApp(App);
```

### Click Tracking

Track user interactions with `data-track:click`:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/click.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/click.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Page Load Tracking

Use `data-track:mounted` to dispatch tracking data when the component mounts (page load):

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/mounted.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/mounted.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Impression Tracking

Use `data-track:view` for IntersectionObserver-based impression tracking:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/view.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/view.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Hierarchical Context

Use `TrackContext` to provide shared data that is merged into all child `Track` components:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/context.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/context.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Multiple Events

Multiple events can be tracked on the same element:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/multiple.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/multiple.twig
<<< ./stories/basic/app.js

:::

</llm-only>

### Custom Events

Listen to CustomEvents from third-party scripts and extract data from `event.detail`:

<llm-exclude>
<PreviewPlayground
  :html="() => import('./stories/basic/custom-event.twig')"
  :script="() => import('./stories/basic/app.js?raw')"
  />
</llm-exclude>
<llm-only>

:::code-group

<<< ./stories/basic/custom-event.twig
<<< ./stories/basic/app.js

:::

</llm-only>
