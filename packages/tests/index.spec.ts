import { test, expect } from 'bun:test';
import * as components from '@studiometa/ui';

test('components exports', () => {
  expect(Object.keys(components)).toMatchSnapshot();
});
