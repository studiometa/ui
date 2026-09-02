import { Base } from '@studiometa/js-toolkit/Base';
import type { BaseConfig, BaseProps } from '@studiometa/js-toolkit';

export type InViewProps = BaseProps & {
  $emits: {
    'in-view': void;
    'out-of-view': void;
  };
};

/**
 * With the default mount strategy, emits `in-view` on viewport entry and `out-of-view` on exit.
 * Use `in-view:<rootMargin>` to configure early mounting.
 */
export class InView extends Base<InViewProps> {
  static config: BaseConfig = {
    name: 'InView',
    mountStrategy: 'in-view',
  };

  mounted(): void {
    this.$emit('in-view');
  }

  unmounted(): void {
    this.$emit('out-of-view');
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/InView`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default InView;
