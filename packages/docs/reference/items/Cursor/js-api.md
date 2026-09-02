---
title: Cursor JS API
---

# JS API

The `Cursor` component extends the [`Base` class](https://js-toolkit-v4.studiometa.dev) using the pointer service. It inherits its API.

It does one thing JavaScript is needed for — read the pointer and damp its position — and publishes the result on its own element. Everything visual is CSS.

## Options

### `damping`

- Type: `number`
- Default: `0.25`

How fast the cursor catches up with the pointer, between `0` and `1`. `1` is no damping at all, and a lower value gives a longer trail.

### `states`

- Type: `Record<string, string>`
- Default: `{}`

A map of CSS selector to state name. The name of the first entry whose selector matches an ancestor-or-self of the element under the pointer is published as [`data-cursor-state`](#data-cursor-state).

```html
<div
  data-component="Cursor"
  data-option-states='{"a, button": "grow", "[data-cursor-shrink]": "shrink"}'></div>
```

Three things follow from the shape:

- **The selectors are matched with `closest()`**, so `"a"` means "over a link", including over anything inside it. No `a *` companion is needed.
- **Entries are tried in declaration order** and the first match wins. Order is the precedence, not depth in the tree.
- **The state names are yours.** There is no fixed list and nothing is reserved.

An invalid selector reports [`cursor.invalid-selector`](#diagnostics) once and is skipped; the other entries keep working.

## CSS custom properties

### `--cursor-x`

Set on the root element, the damped horizontal position of the pointer, in pixels.

### `--cursor-y`

Set on the root element, the damped vertical position of the pointer, in pixels.

The component also applies that position itself, as `translate: var(--cursor-x) var(--cursor-y)` would — with the numbers written directly — so a cursor works with no stylesheet at all. The properties carry the same values for anything else that needs the coordinates.

**The position is written into `translate`, never into `transform`.** The individual transform properties compose in a fixed order — `translate`, `rotate`, `scale`, `transform` — with `translate` outermost. So a `scale` from your stylesheet grows the cursor around the point it sits on, instead of multiplying the coordinates. `rotate`, `scale` and `transform` are all yours.

## Attributes

### `data-cursor-state`

Set on the root element, the state name resolved from the [`states`](#states) map.

**The attribute is always present**, and carries the empty string when the pointer is over nothing the map names. So `[data-cursor-state='']` selects the resting cursor, and a rule never has to test for the attribute's existence.

### `data-cursor-down`

Set on the root element, present while a pointer button is down, absent otherwise.

**It is not a state.** Where the pointer is and whether the button is down are two independent facts, so they get two hooks and your CSS decides how they combine:

```css
[data-cursor-state='grow'] {
  scale: 2;
}
[data-cursor-down] {
  scale: 0.75;
}
[data-cursor-state='grow'][data-cursor-down] {
  scale: 1.6;
}
```

A press over a growing element keeps its `grow`, and `down` stays available as a state name of your own.

## Diagnostics

A development-only warning on the [toolkit diagnostic channel](https://js-toolkit-v4.studiometa.dev/).

| Code                      | Meaning                                                   |
| ------------------------- | --------------------------------------------------------- |
| `cursor.invalid-selector` | An entry of the `states` map is not a valid CSS selector. |

## Styling

The smoothing of everything but the position is a CSS transition, so it runs on the compositor with your own easing:

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
  will-change: translate, scale;
  transition: scale 300ms cubic-bezier(0.25, 1, 0.5, 1);
}

[data-component='Cursor'][data-cursor-state='grow'] {
  scale: 2;
}
```

Any property works, not only `scale` — a colour, a `rotate`, a `mix-blend-mode`, a background image. The component never touches them.

[`Cursor.twig`](/reference/items/Cursor/twig-api) ships that stylesheet, wrapped in `:where()` so it has zero specificity and any declaration of yours wins.
