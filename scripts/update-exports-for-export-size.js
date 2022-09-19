const path = require('path');
const fs = require('fs');

const index = path.resolve(__dirname, '../packages/ui/index.ts');

const content = `import * as PRIMITIVES from './primitives/index.js';
import * as ATOMS from './atoms/index.js';
import * as MOLECULES from './molecules/index.js';
import * as ORGANISMS from './organisms/index.js';

export * from './primitives/index.js';
export * from './atoms/index.js';
export * from './molecules/index.js';
export * from './organisms/index.js';

export {
  PRIMITIVES,
  ATOMS,
  MOLECULES,
  ORGANISMS,
};

export const ALL = {
  PRIMITIVES,
  ATOMS,
  MOLECULES,
  ORGANISMS,
};
`;

fs.writeFileSync(index, content, { encoding: 'UTF-8' });
