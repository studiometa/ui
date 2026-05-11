import { describe, it } from 'vitest';
import { tester } from '../utils/rule-tester.ts';
import { preferAction } from './prefer-action.ts';

describe('prefer-action', () => {
  it('passes and fails correctly', () => {
    tester.run('prefer-action', preferAction as any, {
      valid: [
        // Already imports Action
        `import { Action } from '@studiometa/ui';
         import { Base } from '@studiometa/js-toolkit';
         class Toggle extends Base {
           onClick() { this.$el.classList.toggle('is-active'); }
         }`,

        // Multiple action methods — more complex than what Action handles
        `import { Base } from '@studiometa/js-toolkit';
         class Toggle extends Base {
           onClick() {}
           onMouseenter() {}
         }`,

        // Has additional logic methods
        `import { Base } from '@studiometa/js-toolkit';
         class Toggle extends Base {
           onClick() {}
           updateState() {}
         }`,

        // Accesses $children — orchestrates other components
        `import { Base } from '@studiometa/js-toolkit';
         class Toggle extends Base {
           onClick() { this.$children.Panel[0].open(); }
         }`,

        // Not a Base subclass
        `class Toggle {
           onClick() {}
         }`,
      ],
      invalid: [
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class Toggle extends Base {
  onClick() {
    this.$el.classList.toggle('is-active');
  }
}`,
          errors: [{ messageId: 'preferAction' }],
        },
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class HoverEffect extends Base {
  onMouseenter() {
    this.$el.classList.add('is-hovered');
  }
}`,
          errors: [{ messageId: 'preferAction' }],
        },
        {
          code: `class SubmitBtn extends Base {
  onClick() {
    this.$refs.form.submit();
  }
}`,
          errors: [{ messageId: 'preferAction' }],
        },
      ],
    });
  });
});
