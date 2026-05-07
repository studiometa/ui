import { describe, it } from 'vitest';
import { tester } from '../utils/rule-tester.ts';
import { noManualFetch } from './no-manual-fetch.ts';

describe('no-manual-fetch', () => {
  it('passes and fails correctly', () => {
    tester.run('no-manual-fetch', noManualFetch as any, {
      valid: [
        // fetch without DOM write — just data fetching
        `import { Base } from '@studiometa/js-toolkit';
         class Foo extends Base {
           async mounted() {
             const data = await fetch('/api').then(r => r.json());
             this.data = data;
           }
         }`,

        // Already using Fetch from @studiometa/ui
        `import { Fetch } from '@studiometa/ui';
         import { Base } from '@studiometa/js-toolkit';
         class Foo extends Base {
           async mounted() {
             const res = await fetch('/api');
             this.$el.innerHTML = await res.text();
           }
         }`,

        // innerHTML write without fetch — might be something else
        `import { Base } from '@studiometa/js-toolkit';
         class Foo extends Base {
           mounted() { this.$el.innerHTML = '<p>hello</p>'; }
         }`,

        // Outside a Base subclass
        `async function loadContent(el) {
           const res = await fetch('/fragment');
           el.innerHTML = await res.text();
         }`,
      ],
      invalid: [
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class ProductList extends Base {
  async loadMore() {
    const res = await fetch('/products?page=2');
    this.$el.innerHTML = await res.text();
  }
}`,
          errors: [{ messageId: 'preferFetch' }],
        },
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Facets extends Base {
  async update() {
    const res = await fetch(this.url);
    this.$refs.container.insertAdjacentHTML('beforeend', await res.text());
  }
}`,
          errors: [{ messageId: 'preferFetch' }],
        },
      ],
    });
  });
});
