---
title: Modal anatomy
---

# Anatomy

`Modal` is a single JavaScript component driving a structured piece of markup. It reads a set of `data-ref` elements — triggers, the dialog, the overlay and the content — to open, close and trap focus. Use this map to see which parts exist and how they nest.

## Structure

```
Modal                                  data-component="Modal"
├─ trigger      [data-ref="open"]      (× n)  opens the modal
└─ modal        [data-ref="modal"]     role="dialog", the dialog root
   ├─ overlay   [data-ref="overlay"]   click-to-close backdrop
   └─ wrapper                          centering layer
      └─ container [data-ref="container"]  the scrollable dialog box
         └─ content [data-ref="content"]   the dialog content
            └─ close  [data-ref="close"]  (× n)  closes the modal
```

## Parts

| Part | Selector | Required | Role |
| --- | --- | --- | --- |
| Root | `data-component="Modal"` | Yes | Owns the open / closed state, focus management and keyboard handling. |
| Open trigger | `data-ref="open"` | Optional (× n) | Any element that opens the modal on click. |
| Dialog | `data-ref="modal"` | Yes | The `role="dialog"` element toggled between shown and hidden. |
| Overlay | `data-ref="overlay"` | Optional | The backdrop; clicking it closes the modal. |
| Container | `data-ref="container"` | Yes | The scrollable dialog box. |
| Content | `data-ref="content"` | Yes | The dialog's content. |
| Close trigger | `data-ref="close"` | Optional (× n) | Any element that closes the modal on click. |

The [`Modal.twig`](./twig-api.md) template renders this structure for you, exposing `open`, `close` and `content` blocks. See the [Twig API](./twig-api.md) for parameters and blocks and the [JavaScript API](./js-api.md) for options.
