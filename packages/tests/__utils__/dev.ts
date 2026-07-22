// Enable js-toolkit dev mode (warnings, dev-only guards) for the whole test
// suite. This MUST run before any module imports `@studiometa/js-toolkit`,
// because the library caches `isDev = typeof __DEV__ !== 'undefined' && __DEV__`
// at evaluation time. Listing it ahead of `happydom.ts` (which statically
// imports js-toolkit) guarantees `__DEV__` is set first.
(globalThis as Record<string, unknown>).__DEV__ = true;
