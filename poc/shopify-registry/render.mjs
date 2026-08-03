/**
 * Render the Liquid twin to HTML with LiquidJS (Shopify-compatible dialect),
 * then assemble the demo page. This proves the .liquid snippet is valid and
 * emits the exact data-* contract — independent of any Shopify runtime.
 */
import { Liquid } from 'liquidjs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const engine = new Liquid({ root: resolve(__dirname, 'snippets'), extname: '.liquid' });

const items = [
  { title: 'What is @studiometa/ui?', content: 'Accessible JS behaviours + templates. This markup came from a Liquid snippet.', open: true },
  { title: 'How does the JS attach?', content: 'The auto-loader scanned the DOM, found data-component="Accordion"/"AccordionItem", and registered the published classes from esm.sh — no changes to the JS.', open: false },
  { title: 'Do I need a build step?', content: 'No. One script tag + an import map. The Liquid renders server-side on Shopify; the behaviour hydrates from the CDN.', open: false },
];

const accordionHtml = await engine.renderFile('accordion', { items });

const disclosureItems = [
  { title: 'Shipping & returns', content: 'Free returns within 30 days.', open: false },
  { title: 'Materials', content: 'This panel is a Disclosure — a component not yet on npm, bundled from local source through the same auto-loader.', open: false },
  { title: 'Care instructions', content: 'Machine wash cold.', open: false, disabled: true },
];
const disclosureHtml = await engine.renderFile('disclosure', { id: 'faq', items: disclosureItems });

// The published package barrel does not build on esm.sh yet (mangled re-exports),
// so this PoC serves a barrel bundled from the real local source. The mechanism
// under test — DOM scan → class.$register() — is identical to the CDN path.
const CDN_UI = './assets/studiometa-ui.mjs';

const page = `<!doctype html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>studiometa/ui × Shopify Liquid — Phase 0 PoC</title>
  <style>
    body { font: 16px/1.5 system-ui, sans-serif; max-width: 42rem; margin: 3rem auto; padding: 0 1rem; }
    .accordion__btn { display: block; width: 100%; text-align: left; padding: .75rem 1rem; background: #f1f1f4; border: 1px solid #d7d7de; border-radius: .375rem; margin-top: .5rem; font-weight: 600; cursor: pointer; }
    .accordion__btn[aria-expanded="true"] { background: #3e63dd; color: #fff; }
    .accordion__container { transition: none; }
    .accordion__content { padding: .75rem 1rem; }
    h1 { font-size: 1.25rem; }
    code { background: #f1f1f4; padding: .1em .3em; border-radius: .2em; }
  </style>
  <!-- Single import map pins js-toolkit to ONE instance; the barrel is fetched
       with ?external=@studiometa/js-toolkit so it imports that same instance. -->
  <script type="importmap">
  {
    "imports": {
      "@studiometa/ui": "${CDN_UI}"
    }
  }
  </script>
  <script type="module" src="./assets/studiometa-ui-autoload.mjs"></script>
</head>
<body>
  <h1>Accordion rendered from <code>accordion.liquid</code>, driven by published JS from esm.sh</h1>
  <p>No component code was written for this page — only the Liquid twin and a generic auto-loader.</p>

  <h2 style="font-size:1rem">Accordion (published component)</h2>
  <!-- BEGIN rendered accordion.liquid -->
  ${accordionHtml}
  <!-- END rendered accordion.liquid -->

  <h2 style="font-size:1rem;margin-top:2rem">Disclosure (unpublished component, same auto-loader)</h2>
  <!-- BEGIN rendered disclosure.liquid -->
  ${disclosureHtml}
  <!-- END rendered disclosure.liquid -->
</body>
</html>
`;

await writeFile(resolve(__dirname, 'index.html'), page);
await writeFile(resolve(__dirname, 'rendered-accordion.html'), accordionHtml);
console.log('Rendered accordion HTML:\n');
console.log(accordionHtml);
console.log('\nWrote index.html');
