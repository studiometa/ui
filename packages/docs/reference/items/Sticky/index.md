---
badges: [JS, Twig]
---

# Sticky <Badges :texts="$frontmatter.badges" />

Use the `Sticky` component to keep an element fixed in place while its container scrolls, and to react when the element enters or leaves its sticky state.

## Usage

Register the JavaScript component in your app and include the Twig template:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Sticky } from '@studiometa/ui';

registerComponent(Sticky);
```

```twig
{% include '@ui/Sticky/Sticky.twig' with { content: 'Sticky content' } only %}
```
