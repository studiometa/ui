# Track & TrackContext — Enhanced Payload Design

> Design spec for adding support for complex JSON payloads via `<script>` tags,
> simple data via `data-option-track-*` attributes, and nested `TrackContext` merging.

## Goals

1. **Unified payload API** — Both `Track` and `TrackContext` define their payload the same way
2. **Simple data without JSON** — Flat key/value pairs via `data-option-track-*` attributes (always strings)
3. **Complex data without escaping** — JSON inside `<script type="application/json">` root elements
4. **Nested context hierarchy** — Walk up all ancestor `TrackContext` components, not just the closest
5. **Per-event override** — Inline JSON in `data-track:<event>="..."` still works, with `.no-merge` to skip merge
6. **Backward compatibility** — Existing `data-option-data` on `TrackContext` continues to work

## Payload Resolution

Both `Track` and `TrackContext` resolve their own payload identically:

### Source 1: Script tag content

When the component's root element is a `<script type="application/json">`, its `textContent` is parsed as JSON.

```html
<script type="application/json" data-component="TrackContext">
  { "ecommerce": { "currency": "EUR" }, "page_type": "product" }
</script>
```

### Source 2: `data-option-track-*` attributes

Flat key/value pairs. Values are always strings — no type coercion.

```html
<div data-component="TrackContext"
     data-option-track-page="home"
     data-option-track-site="example.com">
```

### Merge order

Script tag content is the base, attributes are merged on top:

```html
<script type="application/json" data-component="TrackContext"
        data-option-track-page="home">
  { "ecommerce": { "currency": "EUR" } }
</script>
<!-- payload: { ecommerce: { currency: "EUR" }, page: "home" } -->
```

## Context Hierarchy

`TrackContext` components form a hierarchy through **DOM nesting** (parent/child ancestors only). Siblings are ignored.

When a `Track` dispatches, it walks up the DOM collecting all ancestor `TrackContext` payloads. The merge order is outermost first, innermost last (innermost wins on conflicts).

```html
<div data-component="TrackContext" data-option-track-site="example.com">

  <!-- ✗ Sibling — NOT an ancestor of the Track below, ignored -->
  <footer data-component="TrackContext" data-option-track-footer="true">...</footer>

  <!-- ✓ Nested ancestor -->
  <section data-component="TrackContext" data-option-track-page-type="product">

    <script type="application/json" data-component="TrackContext">
      { "product_id": "123", "currency": "EUR" }
    </script>

    <button data-component="Track"
            data-option-track-event="add_to_cart"
            data-track:click>
      Add to Cart
    </button>
    <!-- dispatches: {
      site: "example.com",
      page_type: "product",
      product_id: "123",
      currency: "EUR",
      event: "add_to_cart"
    } -->
  </section>
</div>
```

## Full Dispatch Flow

When an event fires on a `Track` component:

### Normal flow (no `.no-merge`)

Merge priority (lowest → highest, each layer overrides the previous):

| # | Layer | Source |
|---|-------|--------|
| 1 | Context chain | All ancestor `TrackContext` payloads (outermost → innermost) |
| 2 | Track script content | `<script type="application/json">` if root is a script tag |
| 3 | Track attributes | `data-option-track-*` attributes (strings) |
| 4 | Inline event JSON | `data-track:<event>="{ ... }"` value |

Then existing `$detail.*` / `.detail` modifier logic applies on top for `CustomEvent`.

### `.no-merge` modifier

Skips layers 1–3 entirely. Only the inline JSON from the `data-track:<event>` attribute is dispatched.

```html
<button data-component="Track"
        data-option-track-event="cta_click"
        data-option-track-location="header"
        data-track:click
        data-track:view.once.no-merge='{"event":"impression","id":"123"}'>
  Subscribe
</button>
<!-- click dispatches: { event: "cta_click", location: "header", ...contexts }
     view dispatches:  { event: "impression", id: "123" } -->
```

## Usage Examples

### Simple tracking via attributes

```html
<button data-component="Track"
        data-option-track-event="cta_click"
        data-option-track-location="header"
        data-track:click>
  Subscribe
</button>
```

### Complex ecommerce via script tag

```html
<script type="application/json"
        data-component="Track"
        data-track:mounted>
  {
    "event": "view_item_list",
    "ecommerce": {
      "items": [
        { "item_id": "SKU_123", "item_name": "Product A", "price": 29.99 },
        { "item_id": "SKU_456", "item_name": "Product B", "price": 49.99 }
      ]
    }
  }
</script>
```

### TrackContext via attributes

```html
<div data-component="TrackContext"
     data-option-track-page="home"
     data-option-track-site="example.com">
  <!-- children Track components inherit this context -->
</div>
```

### TrackContext via script tag

```html
<script type="application/json" data-component="TrackContext">
  {
    "ecommerce": { "currency": "EUR", "value": 79.98 },
    "page_type": "product"
  }
</script>
```

### Combined: script tag + attributes

```html
<script type="application/json" data-component="TrackContext"
        data-option-track-page="home">
  { "ecommerce": { "currency": "EUR" } }
</script>
<!-- payload: { ecommerce: { currency: "EUR" }, page: "home" } -->
```

### Multiple events with different payloads

```html
<button data-component="Track"
        data-option-track-event="cta_click"
        data-track:click
        data-track:view.once.no-merge='{"event":"impression","id":"123"}'>
  Product
</button>
<!-- click: merged with contexts + attributes
     view:  only { event: "impression", id: "123" } -->
```

### Empty `data-track:<event>` (no inline JSON)

```html
<button data-component="Track"
        data-option-track-event="cta_click"
        data-track:click>
  Click me
</button>
<!-- dispatches payload from contexts + attributes only -->
```

## Implementation Changes

### Shared: `resolvePayload(element)` utility

New function used by both `Track` and `TrackContext` to resolve their payload:

```ts
function resolvePayload(el: HTMLElement): Record<string, unknown> {
  let data: Record<string, unknown> = {};

  // 1. Script tag content (if root is <script type="application/json">)
  if (el.tagName === 'SCRIPT' && el.getAttribute('type') === 'application/json') {
    try {
      data = JSON.parse(el.textContent || '{}');
    } catch { /* warn */ }
  }

  // 2. data-option-track-* attributes (strings, merged on top)
  for (const attr of el.attributes) {
    if (attr.name.startsWith('data-option-track-')) {
      const key = attr.name.slice(18); // Remove 'data-option-track-'
      // Convert kebab-case to camelCase? Or keep as-is with underscores?
      // → Keep kebab-to-snake: data-option-track-page-type → page_type
      const snakeKey = key.replace(/-/g, '_');
      data[snakeKey] = attr.value;
    }
  }

  return data;
}
```

> **Open question:** Key naming for `data-option-track-*` attributes.
> `data-option-track-page-type` → `page_type` (snake_case, analytics-friendly) or `pageType` (camelCase, JS-friendly)?
> Leaning towards **snake_case** since analytics payloads conventionally use it.

### `TrackContext` changes

- Add `resolvePayload()` to compute context data
- Keep `data-option-data` as fallback for backward compatibility
- New `payload` getter that uses `resolvePayload(this.$el)`

### `Track` changes

- Add `resolvePayload()` for its own data
- New `contextData` getter walks up **all** ancestor `TrackContext` (not just closest), merges outermost → innermost
- Handle empty `data-track:<event>` value (no JSON = no inline payload)
- Merge order in `dispatch()`: context chain → own payload → inline JSON
- Support `.no-merge` modifier in `TrackEvent`

### `TrackEvent` changes

- Add `no-merge` as a recognized modifier
- Pass `noMerge` flag so `Track.dispatch()` can skip merge layers
- Handle empty attribute value gracefully (data = `{}`)

## Backward Compatibility

| Current API | Status | Notes |
|---|---|---|
| `data-track:<event>='{"json":"payload"}'` | ✅ Preserved | Still works as the highest-priority inline layer |
| `data-option-data='...'` on TrackContext | ✅ Preserved | Falls back if no `data-option-track-*` or script content |
| `getClosestParent(this, TrackContext)` | ⚠️ Changed | Now walks all ancestors instead of closest only |
| Event modifiers (`.prevent`, `.stop`, `.once`, etc.) | ✅ Preserved | No change |
| `$detail.*` placeholders | ✅ Preserved | Applied after merge |
| Custom dispatcher via `setTrackDispatcher()` | ✅ Preserved | No change |

The only breaking change is **nested TrackContext behavior**: previously only the closest parent was used, now all ancestors are merged. This is additive — existing single-context setups produce identical results.
