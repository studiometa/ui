import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';
import { withTransition } from '../decorators/withTransition.js';

export type {
  Transitionable,
  TransitionInterface,
  TransitionProps,
} from '../decorators/withTransition.js';

/**
 * Runs configured enter and leave CSS transitions on its element.
 *
 * The behaviour lives in `withTransition()` so a component with its own props
 * can mix it in, and this class is the declarative form of the same thing —
 * `withTransition(Base)` and nothing else.
 */
export class Transition<T extends BaseProps = BaseProps> extends withTransition(Base)<T> {
  static config: BaseConfig = {
    name: 'Transition',
  };
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Transition`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Transition;
