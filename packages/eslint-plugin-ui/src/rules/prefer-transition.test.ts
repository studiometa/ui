import { describe, it } from 'vitest';
import { tester } from '../utils/rule-tester.ts';
import { preferTransition } from './prefer-transition.ts';

describe('prefer-transition', () => {
  it('passes and fails correctly', () => {
    tester.run('prefer-transition', preferTransition as any, {
      valid: [
        // Already extends Transition from @studiometa/ui
        `import { Transition } from '@studiometa/ui';
         class Cart extends Transition {
           open() {}
           close() {}
         }`,

        // Has open/close but extends a UI component — fine
        `import { Modal } from '@studiometa/ui';
         class Search extends Modal {
           open() {}
           close() {}
         }`,

        // Only one of the two methods
        `import { Base } from '@studiometa/js-toolkit';
         class Foo extends Base {
           open() {}
         }`,

        // No superclass
        `class Foo {
           open() {}
           close() {}
         }`,
      ],
      invalid: [
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Cart extends Base {
  open() { this.$el.classList.add('is-open'); }
  close() { this.$el.classList.remove('is-open'); }
}`,
          errors: [{ messageId: 'preferTransition' }],
        },
        {
          code: `class Drawer extends Base {
  open() {}
  close() {}
}`,
          errors: [{ messageId: 'preferTransition' }],
        },
      ],
    });
  });
});
