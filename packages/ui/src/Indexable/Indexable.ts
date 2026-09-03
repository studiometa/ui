import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { withIndex, type IndexableProps } from '../decorators/withIndex.js';

export { INDEXABLE_BOUNDARIES, INDEXABLE_INSTRUCTIONS } from '../decorators/withIndex.js';
export type {
  IndexableBoundary,
  IndexableInstruction,
  IndexableInterface,
  IndexableProps,
} from '../decorators/withIndex.js';

/**
 * Tracks a current index within a total, with configurable boundary behaviour
 * (`clamp`, `loop` or `bounce`).
 *
 * The behaviour lives in `withIndex()` so a component with its own base class
 * can mix it in, and this class is the declarative form of the same thing —
 * `withIndex(Base)` and nothing else. There is one implementation; this file
 * adds only the component name.
 */
export class Indexable<T extends BaseProps = BaseProps> extends withIndex(Base)<
  IndexableProps & T
> {
  static config: BaseConfig = {
    name: 'Indexable',
  };
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Indexable`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Indexable;
