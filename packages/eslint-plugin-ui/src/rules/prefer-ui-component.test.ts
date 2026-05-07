import { describe, it } from 'vitest';
import { tester } from '../utils/rule-tester.ts';
import { preferUiComponent } from './prefer-ui-component.ts';

describe('prefer-ui-component', () => {
  it('passes and fails correctly', () => {
    tester.run('prefer-ui-component', preferUiComponent as any, {
      valid: [
        // Unknown component name — not in @studiometa/ui
        `import { Base } from '@studiometa/js-toolkit';
         class Carousel extends Base {}`,

        // Properly extending from @studiometa/ui
        `import { Menu as MenuCore } from '@studiometa/ui';
         class Menu extends MenuCore {}`,

        // Extending a UI component with a different local name
        `import { Accordion } from '@studiometa/ui';
         class MyAccordion extends Accordion {}`,

        // No superclass
        `class Accordion {}`,
      ],
      invalid: [
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Menu extends Base {}`,
          errors: [{ messageId: 'preferImport' }],
        },
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Accordion extends Base {}`,
          errors: [{ messageId: 'preferImport' }],
        },
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Modal extends Base {}`,
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
