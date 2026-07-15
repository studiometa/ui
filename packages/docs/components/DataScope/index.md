---
badges: [JS]
---

# DataScope <Badges :texts="$frontmatter.badges" />

Use `DataScope` to isolate Data groups and Action targets inside a reusable widget. Descendant Data components inherit the scope's group unless they define their own `data-option-group`; nested scopes use the nearest boundary.

```js [app.js]
import { registerComponent } from '@studiometa/js-toolkit';
import { DataComputed, DataModel, DataScope } from '@studiometa/ui';

registerComponent(DataScope);
registerComponent(DataModel);
registerComponent(DataComputed);
```

```html [index.html]
<div data-component="DataScope" data-option-group="person">
  <input name="first" value="Ada" data-component="DataModel" data-option-immediate />
  <input name="last" value="Lovelace" data-component="DataModel" data-option-immediate />
  <span data-component="DataComputed" data-option-compute="$data.first + ' ' + $data.last">
    Ada Lovelace
  </span>
</div>
```

The `group` option defaults to `default`. Keys resolve from `data-option-key`, then from the native form control `name`. Computed and effect callbacks receive the group's frozen `$data` snapshot as their third argument.

Scope membership is resolved when a Data component is initialized. Moving a mounted component between scopes, or changing its group or key dynamically, is not supported.
