import { describe, it } from 'vitest';
import { tester } from '../utils/rule-tester.ts';
import { preferDataModel } from './prefer-data-model.ts';

describe('prefer-data-model', () => {
  it('passes and fails correctly', () => {
    tester.run('prefer-data-model', preferDataModel as any, {
      valid: [
        // Already uses DataModel
        `import { DataModel } from '@studiometa/ui';
         import { Base } from '@studiometa/js-toolkit';
         class Foo extends Base {
           onInputChange() { this.$refs.output.textContent = this.$refs.input.value; }
         }`,

        // Input handler but no DOM write on this.$refs
        `import { Base } from '@studiometa/js-toolkit';
         class Foo extends Base {
           onInputChange() { console.log('changed'); }
         }`,

        // DOM write but no input handler
        `import { Base } from '@studiometa/js-toolkit';
         class Foo extends Base {
           mounted() { this.$refs.label.textContent = 'hello'; }
         }`,

        // Not a Base subclass
        `class Foo {
           onInputChange() { this.$refs.output.textContent = 'x'; }
         }`,
      ],
      invalid: [
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class QuantityInput extends Base {
  onPlusClick() {}
  onMinusClick() {}
  onInputChange() {
    this.$refs.display.textContent = this.$refs.input.value;
  }
}`,
          errors: [{ messageId: 'preferDataModel' }],
        },
        {
          code: `import { Base } from '@studiometa/js-toolkit';
class LiveSearch extends Base {
  onQueryInput() {
    this.$refs.results.innerHTML = '';
  }
}`,
          errors: [{ messageId: 'preferDataModel' }],
        },
      ],
    });
  });
});
