---
badges: [JS, Twig]
---

# Cursor <Badges :texts="$frontmatter.badges" />

Use the cursor component to add a custom cursor to your project.

It reads the pointer, damps its position, and publishes what it knows on its own element: `--cursor-x` and `--cursor-y` for the position, `data-cursor-state` for what the pointer is over, `data-cursor-down` for the button. The visual is a stylesheet.

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

Name the states you want, then style them:

```html
<div
  data-component="Cursor"
  data-option-states='{"a, button": "grow", "[data-cursor-shrink]": "shrink"}'></div>
```

```css
[data-component='Cursor'] {
  position: fixed;
  top: 0;
  left: 0;
  width: 3rem;
  height: 3rem;
  margin: -1.5rem 0 0 -1.5rem;
  border-radius: 9999px;
  background-color: #000;
  pointer-events: none;
  transition: scale 300ms cubic-bezier(0.25, 1, 0.5, 1);
}

[data-component='Cursor'][data-cursor-state='grow'] {
  scale: 2;
}

[data-component='Cursor'][data-cursor-state='shrink'] {
  scale: 0.5;
}
```

Any number of states, any property, your own easing. See the [JS API](/reference/items/Cursor/js-api) for the full published surface.
