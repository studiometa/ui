/**
 * @studiometa/ui — DOM-scanning auto-loader (the "meta component" idea).
 *
 * A single script tag for a Shopify theme: it scans the DOM for every
 * `data-component` present, then registers the matching js-toolkit classes.
 * No per-theme bundle, no hand-written registration list.
 *
 * For now it imports the package barrel once (subpath builds are not shipped
 * to esm.sh yet). Once per-component subpath builds exist, the `resolve`
 * function below becomes a lazy `import(`${CDN}/${name}`)` so only the
 * components actually on the page are downloaded.
 */
import * as UI from '@studiometa/ui';

/** Collect the unique component names declared in the DOM. */
function collectComponentNames(root = document) {
  const names = new Set();
  for (const el of root.querySelectorAll('[data-component]')) {
    for (const name of (el.getAttribute('data-component') || '').split(/\s+/)) {
      if (name) names.add(name);
    }
  }
  return names;
}

/** Resolve a component class by name from the barrel (single instance). */
function resolve(name) {
  const Ctor = UI[name];
  return Ctor && '$isBase' in Ctor ? Ctor : undefined;
}

async function boot() {
  const found = [];
  const missing = [];

  for (const name of collectComponentNames()) {
    const Ctor = resolve(name);
    if (Ctor) {
      // $register is a static on the component's own Base — it uses the
      // barrel's bundled js-toolkit, so no separate toolkit instance is needed.
      Ctor.$register(name);
      found.push(name);
    } else {
      missing.push(name);
    }
  }

  // Surface a result on the page so the PoC can assert on it.
  window.__studiometaUi = { found, missing };
  document.documentElement.setAttribute('data-studiometa-ui-ready', '');
  if (missing.length) {
    console.warn('[studiometa-ui] no export found for:', missing.join(', '));
  }
  console.info('[studiometa-ui] registered:', found.join(', ') || '(none)');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
