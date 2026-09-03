---
badges: [JS, Twig]
---

# Marquee <Badges :texts="$frontmatter.badges" />

Use the Marquee component to move content continuously, faster while the page scrolls. It computes a wrapping progress and publishes it as CSS custom properties; the stylesheet decides whether that progress is a horizontal translation, a rotation, or anything else.

## Usage

After you install the package, include the template in your project and register the class:

```twig
{% include '@ui/Marquee/Marquee.twig' with {
  content: 'Lorem ipsum dolor sit amet elit.'
} %}
```

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Marquee } from '@studiometa/ui';

registerComponent(Marquee);
```

The same class drives a circular marquee. `CircularMarquee.twig` is a Twig-only helper: it writes the text along an SVG `textPath` and renders the very same `data-component="Marquee"`, with a `rotate()` instead of a `translateX()`.

```twig
{% include '@ui/Marquee/CircularMarquee.twig' with {
  id: 'unique-id',
  radius: 120,
  outer_radius: 150,
  content: ' My text content'
} only %}
```

## What it publishes

The component writes three custom properties on its own element, and nothing else. Both templates ship the `transform` that reads them, so they move as soon as the class is registered.

| Property             | Meaning                                     |
| -------------------- | ------------------------------------------- |
| `--marquee-progress` | the travel wrapped into `0…1`               |
| `--marquee-offset`   | the same travel, unwrapped and signed       |
| `--marquee-velocity` | the damped travel rate, in loops per second |

```css
.horizontal {
  transform: translateX(calc(var(--marquee-progress) * -100%));
}
.circular {
  transform: rotate(calc(var(--marquee-progress) * 360deg));
}
.skewed {
  transform: skewX(calc(var(--marquee-velocity) * 1deg));
}
```

One unit of travel is one loop, whatever a loop is worth in pixels: `-100%` of the track **is** the content width, by definition. That is why the component measures nothing — no `clientWidth`, no re-measure on resize, no ref to read.
