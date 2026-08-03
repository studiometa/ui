# Shopify Liquid registry — Phase 0 PoC

A proof-of-concept for distributing `@studiometa/ui` components to **Shopify themes**, borrowing shadcn's registry idea (source distribution + a CLI that copies files into your project) but targeting Liquid instead of React.

It proves one thing: **a Liquid-authored DOM plus a generic auto-loader drives the real, unmodified component JS.** No component code is written or changed — only Liquid twins and one loader.

## The core insight

Every `@studiometa/ui` component is two decoupled halves joined by a pure HTML `data-*` contract:

- **Markup** — a `.twig` template that emits `data-component`, `data-ref`, `data-option-*`, ARIA.
- **Behaviour** — a `@studiometa/js-toolkit` class bound to those attributes.

The JS half is markup-agnostic: it does not care whether the DOM came from Twig, Liquid, or hand-written HTML. So porting a component to Shopify means re-expressing only the markup layer as a Liquid snippet with the same `data-*` contract.

## What's here

| File | Role |
| --- | --- |
| `snippets/accordion.liquid` | Liquid twin of `packages/ui/Accordion/Accordion.twig` (published component) |
| `snippets/disclosure.liquid` | Liquid twin of `packages/ui/Disclosure/Disclosure.twig` (not yet on npm) |
| `assets/studiometa-ui-autoload.mjs` | The "meta component": scans the DOM for `data-component`, resolves each class from the barrel, calls `Class.$register(name)`. No per-theme bundle, no hand-written registration list. |
| `barrel-entry.mjs` | Bundled from the real local source to stand in for the CDN barrel |
| `render.mjs` | Renders the Liquid twins with LiquidJS (Shopify-compatible dialect) and assembles `index.html` |
| `poc-result.png` | Screenshot of the working result |

## Run it

```bash
cd poc/shopify-registry
npm install
npm start          # build barrel → render Liquid → serve on :8899
# open http://localhost:8899/index.html
```

## Result

Verified in a real browser (both components, one generic loader, zero JS changes):

- The auto-loader reported `found: [Accordion, AccordionItem, DisclosureGroup, Disclosure], missing: []`.
- Accordion: clicking a trigger flipped `aria-expanded` false → true.
- Disclosure: clicking a trigger flipped `aria-expanded` and removed `hidden` from the panel.
- The `data-option-disabled` disclosure authored in Liquid correctly ignored its click — the Liquid-authored option was honoured by the real JS.

## Findings that shape the real design

1. **The auto-loader is trivially small.** `registerComponent(C)` is just sugar for `C.$register()`, a static on the component's own bundled `Base`. So the loader needs no separate js-toolkit import and no import-map/version pinning — `import * as UI; UI[name].$register(name)` is the entire runtime.

2. **The published package does not build on esm.sh today.** `@studiometa/ui@1.9.0` fails on esm.sh with `'../utils.mjs' does not provide an export named 'getAncestorWhereUntil'` (js-toolkit's mangled single-letter re-exports the CDN bundler can't reconcile), and subpath exports 404 because the export map points at `.ts` sources. This PoC therefore serves a self-contained ESM barrel bundled with esbuild — which is what a dedicated CDN would serve. **esm.sh is not viable as-is; the CDN must serve prebuilt bundles.** Per-component lazy `import()` waits on subpath builds shipping.

## Not yet built (next steps)

- A shadcn-compatible registry manifest per component (`files[]` → theme `snippets/` + the loader asset, `registryDependencies`, `dependencies`).
- The installer CLI (`npx @studiometa/ui add disclosure` → detect theme, resolve deps, write Liquid, patch `layout/theme.liquid`).
- A CDN endpoint serving prebuilt per-component bundles.
- Liquid twins for the rest of the curated headless subset; a shared `render-attributes` snippet to reduce twin verbosity.
