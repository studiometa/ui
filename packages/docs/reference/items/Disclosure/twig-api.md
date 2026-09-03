---
title: Disclosure Twig API
---

# Twig API

Use `@ui/Disclosure/Disclosure.twig` to render an accessible group of disclosures. The template renders a `DisclosureGroup` root and independently marked `Disclosure` items.

## Parameters

### `id`

- Type: `string`
- Required: yes

A unique ID for the group. It is applied to the root and used as the prefix for generated item, trigger, and panel IDs.

### `items`

- Type: `array<{ title: string, content: unknown, open?: boolean, disabled?: boolean, id?: string, attr?: array, trigger_attr?: array, panel_attr?: array }>`
- Required: yes

The disclosure items. `title` and `content` provide the default block values. `open` and `disabled` default to false. An item `id` produces `${item.id}-trigger` and `${item.id}-panel`; otherwise the template uses `${id}-item-${loop.index}` as the item ID. Item-level attribute arrays customize presentation attributes, while the required component, ref, ID and accessibility state attributes are applied last.

### `heading_tag`

- Type: `string`
- Default: `'h3'`

The native heading element wrapping each trigger button. Choose a heading level appropriate to the page outline.

### `attr`

- Type: `array`

Attributes for the `DisclosureGroup` root. Use this parameter to configure group options such as `data_option_no_multiple: true` and `data_option_no_collapsible: true`.

### `item_attr`

- Type: `array`

Default presentation attributes merged into every `Disclosure` section before each item's `attr` and the required component/state attributes.

### `trigger_attr`

- Type: `array`

Default presentation attributes merged into every native trigger button before each item's `trigger_attr` and the required ID, ref and accessibility attributes.

### `panel_attr`

- Type: `array`

Default presentation attributes merged into every panel before each item's `panel_attr` and the required ID, ref and accessibility attributes. Add `role: 'region'` only when the extra landmark is useful.

## Blocks

### `title`

Customizes each trigger's label. Defaults to `item.title`. The current `item` and Twig loop context are available.

### `content`

Customizes each panel's content. Defaults to `item.content`. The current `item` and Twig loop context are available.

## Rendered state

The template renders `type="button"`, the trigger/panel IDs, `aria-controls`, `aria-expanded`, `disabled` for disabled items, `aria-labelledby`, and initial `hidden` state. It does not add `role="region"` by default. JavaScript preserves the rendered IDs and takes ownership of `aria-expanded`, `hidden`, and temporary `inert` state after mounting.

```twig
{% include '@ui/Disclosure/Disclosure.twig' with {
  id: 'product-faq',
  heading_tag: 'h2',
  items: items,
  attr: {
    data_option_no_multiple: true,
    data_option_no_collapsible: true
  },
  panel_attr: { role: 'region' }
} %}
```
