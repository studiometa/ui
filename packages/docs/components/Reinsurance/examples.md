---
outline: deep
---

# Reinsurance <Badges :texts="badges" />

## 4 center items
<PreviewPlayground
  :html="() => import('./stories/app.twig')"
  />

## 3 center items
<PreviewPlayground
  :html="() => import('./stories/app-1.twig')"
  />

## Slider in mobile (only css)
<PreviewPlayground
  :html="() => import('./stories/app-2.twig')"
  />

## Stylized section
<PreviewPlayground
  :html="() => import('./stories/app-3.twig')"
  />

<script setup>
  import pkg from '@studiometa/ui/Reinsurance/package.json';

  const badges = [`v${pkg.version}`, 'Twig'];
</script>

Use this component to create Reinsurance. Horizontal list of elements with icons, title and content.

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Once the [package installed](/guide/installation/), simply include the Twig template component in your project:

```twig
{% include '@ui-pkg/Reinsurance/Reinsurance.twig' with {
  list: list
} only %}
```

## HTML Snippet

```twig
<section class="text-[0] pt-14 pb-6 text-center w-full">
  {% for item in 0..4 %}
    <div class="inline-block align-top mb-12 s:mb-8 px-3 w-56 whitespace-normal">
      <!-- Change -->
      <span class="inline-block mb-2 s:mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 -960 960 960" width="48"><path d="m333-259 147-88 148 89-40-166 130-113-171-15-67-158-66 157-171 15 130 112-40 167ZM223-107l68-292L64-596l300-25 116-276 117 276 299 25-227 197 68 292-257-155-257 155Zm257-367Z"/></svg>
      </span>
      <p class="text-xl mb-2">
        <!-- Change -->
        Titre {{ loop.index0 }}
      </p>
      <p class="text-sm text-black-50 mb-0">
        <!-- Change -->
        Contenu {{ loop.index0 }}
      </p>
    </div>
  {% endfor %}
</section>
```
