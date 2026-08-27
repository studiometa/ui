import { afterEach } from 'vitest';
import { resetDom } from '@studiometa/js-toolkit/test';

// Clean up after every test: empty the document, which lets the shared mutation
// observer dispose every controller it built (and with them the RAF loop, the
// pointer and resize listeners…), then wait for the unmounts to land. This
// keeps a test's asynchronous work from leaking into the next one.
//
// v3's page-wide `getInstances()` is gone in v4: instances live on their
// element and nothing collects them, so `resetDom()` from
// `@studiometa/js-toolkit/test` is the supported way to reach them all.
afterEach(async () => {
  await resetDom();
});
