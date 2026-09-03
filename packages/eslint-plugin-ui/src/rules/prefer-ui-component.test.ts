import { describe, it } from 'vitest';
import { tester } from '../utils/rule-tester.ts';
import { preferUiComponent } from './prefer-ui-component.ts';

describe('prefer-ui-component', () => {
  it('passes and fails correctly', () => {
    tester.run('prefer-ui-component', preferUiComponent as any, {
      valid: [
        // A name @studiometa/ui does not export.
        `import { Base } from '@studiometa/js-toolkit';
         class InvoiceRow extends Base {}`,

        // Properly extending from @studiometa/ui
        `import { Menu as MenuCore } from '@studiometa/ui';
         class Menu extends MenuCore {}`,

        // Extending a UI component with a different local name
        `import { Disclosure } from '@studiometa/ui';
         class MyDisclosure extends Disclosure {}`,

        // No superclass
        `class Carousel {}`,
      ],
      invalid: [
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Menu extends Base {}`,
          errors: [{ messageId: 'preferImport' }],
        },
        {
          // The list is generated from the autoload catalog now. It used to be
          // hand-written, and `Carousel` was missing from it — so this exact
          // code was the fixture's *valid* case, passing because the rule could
          // not see the component rather than because there was nothing to see.
          code: `import { Base } from '@studiometa/js-toolkit';
class Carousel extends Base {}`,
          errors: [{ messageId: 'preferImport' }],
        },
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Dialog extends Base {}`,
          errors: [{ messageId: 'preferImport' }],
        },
        {
          // Bare Base (no import) also triggers
          code: `class Sticky extends Base {}`,
          errors: [{ messageId: 'preferImport' }],
        },
      ],
    });
  });
});
