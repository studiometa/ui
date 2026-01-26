# v1.0 → v2.0

You will find on this page documentation on all the breaking changes included in the v2.0 of the package.

[[toc]]

## ScrollAnimation components have been refactored

The `ScrollAnimation` family of components has been refactored for better performance and flexibility. The new API uses `ScrollAnimationTimeline` as a parent component that manages scroll progress, with `ScrollAnimationTarget` children that handle individual animations.

### Summary of component renames

| v1.0 (deprecated)             | v2.0 (new)                                          |
| ----------------------------- | --------------------------------------------------- |
| `ScrollAnimation`             | `ScrollAnimationTimeline` + `ScrollAnimationTarget` |
| `ScrollAnimationParent`       | `ScrollAnimationTimeline`                           |
| `ScrollAnimationChild`        | `ScrollAnimationTarget`                             |
| `ScrollAnimationChildWithEase`| `ScrollAnimationTarget` with `dampFactor` option    |
| `ScrollAnimationWithEase`     | `ScrollAnimationTimeline` + `ScrollAnimationTarget` |
| `animationScrollWithEase`     | Extend `ScrollAnimationTarget` instead              |

### Benefits of the new API

The refactored API provides several benefits:

1. **Better performance**: The timeline only watches one element for scroll position, reducing the number of intersection observers
2. **Independent damping**: Each target can have its own `dampFactor`, allowing different animation speeds within the same timeline
3. **Simpler markup**: No need for a `target` ref — the component animates itself
4. **Clearer naming**: `Timeline` and `Target` clearly describe the parent-child relationship
5. **More flexible**: Easier to coordinate multiple animations with different play ranges

### Replace `ScrollAnimation` with `ScrollAnimationTimeline` and `ScrollAnimationTarget`

The standalone `ScrollAnimation` component has been removed. Use `ScrollAnimationTimeline` with `ScrollAnimationTarget` children instead.

**Before (v1.0):**

```html
<div
  data-component="ScrollAnimation"
  data-option-from='{"opacity": 0, "y": 100}'
  data-option-to='{"opacity": 1, "y": 0}'
>
  <div data-ref="target">
    Content to animate
  </div>
</div>
```

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimation } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimation,
    },
  };
}

export default createApp(App, document.body);
```

**After (v2.0):**

```html
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-from='{"opacity": 0, "y": 100}'
    data-option-to='{"opacity": 1, "y": 0}'
  >
    Content to animate
  </div>
</div>
```

```js
import { Base, createApp } from '@studiometa/js-toolkit';
import { ScrollAnimationTimeline, ScrollAnimationTarget } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: {
      ScrollAnimationTimeline,
      ScrollAnimationTarget,
    },
  };
}

export default createApp(App, document.body);
```

::: tip Key differences
- The `target` ref is no longer needed — `ScrollAnimationTarget` animates itself
- Animation options (`from`, `to`, `playRange`, etc.) are now on `ScrollAnimationTarget`
- Multiple targets can share the same timeline for coordinated animations
:::

### Replace `ScrollAnimationParent` with `ScrollAnimationTimeline`

The `ScrollAnimationParent` component has been renamed to `ScrollAnimationTimeline`.

**Before (v1.0):**

```html
<div data-component="ScrollAnimationParent">
  <div data-component="ScrollAnimationChild" data-option-from='{"opacity": 0}'>
    ...
  </div>
</div>
```

```js
import { ScrollAnimationParent, ScrollAnimationChild } from '@studiometa/ui';
```

**After (v2.0):**

```html
<div data-component="ScrollAnimationTimeline">
  <div data-component="ScrollAnimationTarget" data-option-from='{"opacity": 0}'>
    ...
  </div>
</div>
```

```js
import { ScrollAnimationTimeline, ScrollAnimationTarget } from '@studiometa/ui';
```

### Replace `ScrollAnimationChild` with `ScrollAnimationTarget`

The `ScrollAnimationChild` component has been renamed to `ScrollAnimationTarget`.

```diff
- <div data-component="ScrollAnimationChild" data-option-from='{"opacity": 0}'>
+ <div data-component="ScrollAnimationTarget" data-option-from='{"opacity": 0}'>
    ...
  </div>
```

```diff
- import { ScrollAnimationChild } from '@studiometa/ui';
+ import { ScrollAnimationTarget } from '@studiometa/ui';
```

### Replace `ScrollAnimationChildWithEase` with `ScrollAnimationTarget`

The `ScrollAnimationChildWithEase` component has been removed. Use `ScrollAnimationTarget` with the `dampFactor` option instead.

**Before (v1.0):**

```html
<div data-component="ScrollAnimationParent">
  <div data-component="ScrollAnimationChildWithEase" data-option-from='{"opacity": 0}'>
    ...
  </div>
</div>
```

```js
import { ScrollAnimationChildWithEase } from '@studiometa/ui';
```

**After (v2.0):**

```html
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-damp-factor="0.1"
    data-option-from='{"opacity": 0}'
  >
    ...
  </div>
</div>
```

```js
import { ScrollAnimationTarget } from '@studiometa/ui';
```

::: tip
Each `ScrollAnimationTarget` can have its own `dampFactor` value, allowing for different animation speeds within the same timeline.
:::

### Replace `ScrollAnimationWithEase` with `ScrollAnimationTimeline` and `ScrollAnimationTarget`

The `ScrollAnimationWithEase` component has been removed. Use `ScrollAnimationTimeline` with `ScrollAnimationTarget` children that have the `dampFactor` option.

**Before (v1.0):**

```html
<div
  data-component="ScrollAnimationWithEase"
  data-option-from='{"opacity": 0}'
>
  <div data-ref="target">...</div>
</div>
```

**After (v2.0):**

```html
<div data-component="ScrollAnimationTimeline">
  <div
    data-component="ScrollAnimationTarget"
    data-option-damp-factor="0.1"
    data-option-from='{"opacity": 0}'
  >
    ...
  </div>
</div>
```

### Remove `animationScrollWithEase` decorator

The `animationScrollWithEase` decorator has been removed without a direct replacement. If you were using it to create custom scroll animation components, extend `ScrollAnimationTarget` instead.

**Before (v1.0):**

```js
import { Base } from '@studiometa/js-toolkit';
import { animationScrollWithEase } from '@studiometa/ui';

class MyScrollAnimation extends animationScrollWithEase(Base) {
  // ...
}
```

**After (v2.0):**

```js
import { ScrollAnimationTarget } from '@studiometa/ui';

class MyScrollAnimation extends ScrollAnimationTarget {
  static config = {
    ...ScrollAnimationTarget.config,
    name: 'MyScrollAnimation',
  };

  // Override methods as needed
}
```
