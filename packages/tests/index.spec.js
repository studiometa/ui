import * as components from '@studiometa/ui';
import getFilenamesInFolder from './__utils__/getFilenamesInFolder.js';

test('components exports', () => {
  const names = getFilenamesInFolder('../ui/', import.meta.url).filter(
    (name) => !name.endsWith('.json')
  );
  expect(Object.keys(components)).toEqual(names);
});
