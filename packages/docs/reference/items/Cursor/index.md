---
badges: [JS, Twig]
---

# Cursor <Badges :texts="$frontmatter.badges" />

Use the cursor component to add a custom cursor to your project.

## Usage

After you install the [package](/guide/installation/), include the template in your project:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Cursor } from '@studiometa/ui';

registerComponent(Cursor);
```

```twig
{% include '@ui/Cursor/Cursor.twig' only %}
```
