---
badges: [Twig]
---

# Hero <Badges :texts="$frontmatter.badges" />

## Table of content

- [Examples](./examples.md)
- [Twig API](./twig-api.md)

## Usage

Include or embed the Twig template in your project.

```twig
{# Include tag #}
{% include '@ui/Hero/Hero.twig' with { title: 'Hello world' } %}

{# Include function #}
{{ include('@ui/Hero/Hero.twig', { title: 'Hello world' }) }}

{# Embed tag #}
{% embed '@ui/Hero/Hero.twig' with { title_tag: 'h1' } %}
  {% block title %}
    Hello world
  {% endblock %}
{% endembed %}
```
