---
title: Track Examples
---

# Examples

## E-commerce Tracking

### Product List View

```twig
{# Track product list view on page load #}
<div
  data-component="Track"
  data-on:mounted='{{ {
    event: "view_item_list",
    ecommerce: {
      items: products|map(p => {
        item_id: p.sku,
        item_name: p.name,
        price: p.price
      })
    }
  }|json_encode }}'
  hidden>
</div>
```

### Product Click

```twig
<a
  href="{{ product.url }}"
  data-component="Track"
  data-on:click='{{ {
    event: "select_item",
    ecommerce: {
      items: [{
        item_id: product.sku,
        item_name: product.name,
        price: product.price
      }]
    }
  }|json_encode }}'>
  {{ product.name }}
</a>
```

### Add to Cart

```twig
<section
  data-component="TrackContext"
  data-option-data='{{ {
    page_type: "product",
    product_id: product.sku,
    product_name: product.name
  }|json_encode }}'>

  <button
    data-component="Track"
    data-on:click='{{ {
      event: "add_to_cart",
      ecommerce: {
        currency: "EUR",
        value: product.price,
        items: [{
          item_id: product.sku,
          item_name: product.name,
          price: product.price,
          quantity: 1
        }]
      }
    }|json_encode }}'>
    Add to Cart
  </button>
</section>
```

### Purchase Confirmation

```twig
{# On thank you page #}
<div
  data-component="Track"
  data-on:mounted='{{ {
    event: "purchase",
    ecommerce: {
      transaction_id: order.id,
      value: order.total,
      currency: "EUR",
      items: order.items|map(item => {
        item_id: item.sku,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      })
    }
  }|json_encode }}'
  hidden>
</div>
```

## Navigation Tracking

### Menu Click

```twig
<nav
  data-component="TrackContext"
  data-option-data='{{ { menu_location: "header" }|json_encode }}'>

  {% for item in menu_items %}
    <a
      href="{{ item.url }}"
      data-component="Track"
      data-on:click='{{ {
        event: "menu_click",
        menu_item: item.title,
        menu_position: loop.index
      }|json_encode }}'>
      {{ item.title }}
    </a>
  {% endfor %}
</nav>
```

### Footer Link

```twig
<footer
  data-component="TrackContext"
  data-option-data='{{ { link_location: "footer" }|json_encode }}'>

  <a
    href="/contact"
    data-component="Track"
    data-on:click='{{ { event: "link_click", link_text: "Contact Us" }|json_encode }}'>
    Contact Us
  </a>
</footer>
```

## Form Tracking

### Form Submission

```twig
<form
  data-component="Track"
  data-on:submit.prevent='{{ {
    event: "form_submit",
    form_name: "newsletter",
    form_location: "footer"
  }|json_encode }}'>
  <input type="email" name="email" required>
  <button type="submit">Subscribe</button>
</form>
```

### Search Input (Debounced)

```twig
<input
  type="search"
  data-component="Track"
  data-on:input.debounce500='{{ { event: "search_query" }|json_encode }}'
  placeholder="Search...">
```

## Impression Tracking

### Product Card Impression

```twig
{% for product in products %}
  <div
    data-component="Track"
    data-on:view.once='{{ {
      event: "view_item",
      ecommerce: {
        items: [{
          item_id: product.sku,
          item_name: product.name,
          item_list_name: "Category Page",
          index: loop.index,
          price: product.price
        }]
      }
    }|json_encode }}'>
    {# Product card content #}
  </div>
{% endfor %}
```

### Banner Impression

```twig
<div
  data-component="Track"
  data-option-threshold="0.8"
  data-on:view.once='{{ {
    event: "promotion_view",
    promotion_id: banner.id,
    promotion_name: banner.title,
    creative_slot: "homepage_hero"
  }|json_encode }}'>
  <img src="{{ banner.image }}" alt="{{ banner.title }}">
</div>
```

## Video Tracking

### Video Play

```twig
<video
  data-component="Track"
  data-on:play='{{ { event: "video_start", video_title: video.title }|json_encode }}'
  data-on:pause='{{ { event: "video_pause", video_title: video.title }|json_encode }}'
  data-on:ended='{{ { event: "video_complete", video_title: video.title }|json_encode }}'>
  <source src="{{ video.url }}" type="video/mp4">
</video>
```

## Scroll Tracking

### Scroll Depth (Throttled)

```twig
<main
  data-component="Track"
  data-on:scroll.throttle200.passive='{{ { event: "scroll_depth" }|json_encode }}'>
  {# Page content #}
</main>
```

## Third-Party Integration

### Custom Event from External Script

```html
<!-- Third-party form that dispatches 'form-success' CustomEvent -->
<div
  id="hubspot-form"
  data-component="Track"
  data-on:form-success='{"event": "lead_generated", "source": "$detail.source", "email": "$detail.email"}'></div>
```

## Multiple Events on Same Element

```twig
<a
  href="{{ product.url }}"
  data-component="Track"
  data-on:click='{{ { event: "select_item", item_id: product.sku }|json_encode }}'
  data-on:auxclick='{{ { event: "select_item", item_id: product.sku, method: "new_tab" }|json_encode }}'
  data-on:contextmenu='{{ { event: "select_item", item_id: product.sku, method: "context_menu" }|json_encode }}'>
  {{ product.name }}
</a>
```
