---
title: DataScope anatomy
---

# Anatomy

`DataScope` is the container of the [Data family](../../guide/concepts/#the-data-family). It groups `DataModel`, `DataBind`, `DataComputed` and `DataEffect` descendants into one reactive widget, so they share a group without writing a JavaScript class. Use this map to see which parts belong inside a scope and how they nest.

## Structure

```
DataScope                              data-component="DataScope"
├─ DataModel      (× n)                data-component="DataModel"      reads form inputs
├─ DataBind       (× n)                data-component="DataBind"       writes a value into the DOM
├─ DataComputed   (× n)                data-component="DataComputed"   transforms values
├─ DataEffect     (× n)                data-component="DataEffect"     runs on change
└─ DataScope      (× n)                nested scope                    (optional)
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Scope | `data-component="DataScope"` | Yes | The boundary. Descendants inherit its default group unless they set their own `data-option-group`. |
| Model | [`data-component="DataModel"`](../DataModel/) | Optional | Reads values from form inputs into the scope. |
| Bind | [`data-component="DataBind"`](../DataBind/) | Optional | Writes a scoped value into the DOM. |
| Computed | [`data-component="DataComputed"`](../DataComputed/) | Optional | Derives a value from the scope. |
| Effect | [`data-component="DataEffect"`](../DataEffect/) | Optional | Runs code when a scoped value changes. |
| Nested scope | `data-component="DataScope"` | Optional | Descendants resolve to the nearest `DataScope` boundary. |

Descendants inherit the scope's group unless they define their own `data-option-group`. See the [JavaScript API](./js-api.md) for group inheritance, keys and scoped data snapshots.
