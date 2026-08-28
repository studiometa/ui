# Declarative runtime

JavaScript components are registered in an application entry point and mounted from the DOM. Markup declares which behavior applies and provides its configuration, so server-rendered templates and browser behavior share a visible contract.

## Register components

Use [`registerComponent`](https://js-toolkit-v4.studiometa.dev/api/registry/registerComponent.html) for one component or `registerComponents` for several:

```js
import { registerComponents } from '@studiometa/js-toolkit';
import { Disclosure, Dialog, Slider } from '@studiometa/ui';

registerComponents(Disclosure, Dialog, Slider);
```

By default, each class mounts on elements whose `data-component` value contains its configured name:

```html
<div data-component="Dialog">…</div>
```

`registerComponent()` takes the class and nothing else: a component mounts on its configured name, and there is no selector form. Subclass it and declare a name when the markup uses a different one:

```js
import { registerComponent } from '@studiometa/js-toolkit';
import { Dialog } from '@studiometa/ui';

class SiteDialog extends Dialog {
  static config = {
    name: 'SiteDialog',
  };
}

registerComponent(SiteDialog);
```

```html
<div data-component="SiteDialog">…</div>
```

Registration is the default application boundary. It keeps feature imports explicit and avoids an application class when components do not need to coordinate with one another.

No `@studiometa/ui` class registers itself when its module is imported: importing defines the class, registering is what makes it mount. The rule holds for every component in the package, so one explicit list of what a page uses is the whole picture — or hand the job to the [autoloader](/guide/autoloading/), which registers the catalog and imports each component on demand.

## Compose behavior on an element

An element can mount more than one registered component. Separate names with spaces:

```html
<button
  data-component="Action Timer"
  data-option-delay="5"
  data-option-effect="this.classList.add('is-ready')">
  Start
</button>
```

Each class owns its documented options and events. Use this pattern when independent behaviors share the same semantic element; use a compound component when parts need a parent-child contract.

## Options

`data-option-<name>` attributes configure a component instance. Attribute names use kebab case while JavaScript APIs usually show camel case:

```html
<div data-component="Timer" data-option-delay="3" data-option-no-autostart></div>
```

Values are parsed from the option type declared by the component:

- strings keep their attribute value;
- numbers use JavaScript number conversion;
- a boolean whose default is `false` becomes `true` when its attribute is present;
- a boolean whose default is `true` becomes `false` through `data-option-no-<name>`;
- arrays and objects use JSON.

```html
<div data-component="InView" data-option-intersection-observer='{ "rootMargin": "100px" }'>…</div>
```

Follow each item's JavaScript API for its accepted type and default. Quote JSON with valid double-quoted keys and values.

## Refs

`data-ref` marks elements owned by a component. A singular ref names one element; a name ending in `[]` contributes to a collection:

```html
<div data-component="Menu">
  <button data-ref="btn">Open</button>
  <div data-ref="list">
    <a data-ref="items[]" href="/one">One</a>
    <a data-ref="items[]" href="/two">Two</a>
  </div>
</div>
```

A component reads declared refs below its root until another component boundary owns them. Co-located components can both read the same unprefixed ref when both contracts declare that name. Prefix a ref with the component name, such as `data-ref="Menu.btn"`, when the ownership must be explicit. Item-specific anatomy pages show required structure when order or nesting matters.

## Events and component hooks

Components emit named events such as `disclosure-open`, `defer-content`, `index` or `in-view`. Parent components and application classes can respond through js-toolkit's `on<ComponentName><EventName>` hook convention. The hook receives the emitting child instance as `target` and the event's detail as `payload`:

```js
import { Base, registerComponent } from '@studiometa/js-toolkit';
import { Dialog } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    components: { Dialog },
  };

  onDialogOpen({ target, payload }) {
    console.log('Opened dialog', target, payload);
  }
}

registerComponent(App);
```

```html
<div data-component="App">
  <dialog data-component="Dialog">…</dialog>
</div>
```

Component events bubble, so a listener on an ancestor hears its descendants too. That is why each family prefixes its events with its own name — `disclosure-open` rather than `open`. The Reference documents events exposed by each item. Use native DOM events for browser interactions and component events for communication between registered behaviors.

## Lifecycle and DOM ownership

Registered components mount when matching elements enter the observed document and are destroyed when their roots leave it. Keep these rules in mind:

- let registration own component construction rather than instantiating classes manually;
- keep required refs inside their component boundary;
- preserve or deliberately replace component roots during partial DOM updates;
- clean up application-owned listeners and resources in lifecycle hooks;
- treat server-rendered markup as the source of the initial state.

Components such as [`Fetch`](/reference/items/Fetch/) and [`Defer`](/reference/items/Defer/) update parts of the DOM while cooperating with this lifecycle.

## When to use an application component

Use a normal custom component for reusable or page-local behavior owned by one root element. Write an application component only when the page itself needs root-level refs, event handlers or methods that coordinate several children. Do not introduce one only to register unrelated components.

There is no `createApp()` in js-toolkit v4: an application component is an ordinary component. Register it and give its root element the matching `data-component`, which is also what scopes its refs.

```js
import { Base, registerComponent } from '@studiometa/js-toolkit';
import { Transition } from '@studiometa/ui';

class App extends Base {
  static config = {
    name: 'App',
    refs: ['enterBtn'],
    components: { Transition },
  };

  onEnterBtnClick() {
    this.$query('Transition')[0]?.enter();
  }
}

registerComponent(App);
```

```html
<body data-component="App">
  <button data-ref="enterBtn">Enter</button>
  <div data-component="Transition">…</div>
</body>
```

## Progressive enhancement

Prefer markup that remains meaningful before JavaScript mounts. Native links, buttons, forms and dialog semantics provide a baseline; registered components add transitions, asynchronous updates, coordination and richer interaction. When a feature cannot work without JavaScript, keep its loading, error and disabled states explicit in the markup.

## Related concepts

- [Composition](./composition.md)
- [Templates and customization](./templates-and-customization.md)
- [Usage quickstart](/guide/usage/)
