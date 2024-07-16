import { test, expect } from '@jest/globals';
import * as components from '@studiometa/ui';

test('components exports', () => {
  expect(Object.keys(components)).toMatchSnapshot();
});
