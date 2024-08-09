---
title: Action JS API
---

# JS API

## Options

### `on`

- Type: `string`
- Default: `'click'`
- Format: `<event>[.<modifier>...]`

Use this option to change the event that will trigger the [effect callback](#effect) on the defined [targets](#target). Modifiers can be used to configure how the event will be listened to. Available modifiers are:

- `prevent` to call the `event.preventDefault()` in the event handler
- `stop` to call the `event.stopPropagation()` in the event handler
- `passive` to register the handler with passive mode enabled
- `once` to trigger the handler only once
- `capture` to register the handle in capture mode

Modifiers can be chained with a `.` as separator:

```html {3}
<button
  data-component="Action"
  data-option-on="click.prevent.stop.passive">
  Click me
</button>
```

### `target`

- Type: `string`
- Available formats:
  - `Name`
  - `Name OtherName`
  - `Name(.selector)`
  - `Name(.selector) OtherName([value="other-selector"])`

Use this option to define the components that should be used as targets to the [effect callback](#effect). Multiple components can be defined by using a single space as delimiter.

::: info Name definition
The `Action` component will use the `name` property defined in the static `config` object of each class to resolve components on the page.

```js {3}
class Foo extends Base {
  static config = {
    name: 'Foo',
  };
}
```
:::

#### No target

By not defining the `target` option, the default target will be the current `Action` instance. The following will toggle the `clicked` class on the `<button>` element:

```html
<button
  data-component="Action"
  data-option-effect="target.classList.toggle('clicked')"
  class="clicked">
  Click me
</button>
```

#### Single target

The following configuration will use all `Foo` components as targets, the effect callback will be triggered for each and every one of them.

```html {3}
<button
  data-component="Action"
  data-option-target="Foo">
  Click me
</button>
```

#### Multiple targets

```html {3}
<button
  data-component="Action"
  data-option-target="Foo Bar">
  Click me
</button>
```

#### Reduce the list of target with a selector

In the following example, the effect callback will only be triggered on the `Foo` component with the `foo` id.

```html {3,9}
<button
  data-component="Action"
  data-option-target="Foo(#foo)">
  Click me
</button>

<div
  data-component="Foo"
  id="foo">
  ...
</div>

<div
  data-component="Foo"
  id="bar">
  ...
</div>
```


### `effect`

- Type: `string`
- Required

The `effect` option must be used to define a small piece of JavaScript that will be executed in the context of the current target. The following variables are available:

- `ctx` (`Record<name, Base>`): the current targeted component in an object with a uniq key being its name set in the static `config.name` property and the value being the component instance
- `event` (`Event`): the event that triggered the action
- `target` (`Base`): a direct reference to the current targeted component
- `action` (`Base`): a direct reference to the current action component

#### Simple effect vs callback effect

The effect can also define an arrow function which will be executed as well. The following examples are similar:

```html {3,9}
<button
  data-component="Action"
  data-option-effect="console.log('clicked')">
  Click me
</button>

<button
  data-component="Action"
  data-option-effect="() => console.log('clicked')">
  Click me
</button>
```

#### Advanced usage with destructuration

This can be useful to destructure the first `ctx` parameter and make a direct reference to the targeted component's name when multiple target are defined:

```html {3,4}
<button
  data-component="Action"
  data-option-target="Foo Bar"
  data-option-effect="({ Foo, Bar }) => { Foo?.$update(); Bar?.$update() }">
  Click me
</button>
```

::: warning Advanced pattern
The pattern described above with multiple components as targets is an advanced pattern that should be used with care, as it adds complexity to the DOM that might not be necessary.
:::
