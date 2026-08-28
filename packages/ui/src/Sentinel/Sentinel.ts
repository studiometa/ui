import {
  Base,
  withInView,
  type BaseConfig,
  type BaseProps,
  type InViewProps,
} from '@studiometa/js-toolkit';

export type SentinelProps = BaseProps & {
  $emits: { intersected: InViewProps };
};

/**
 * A minimal marker element that reports its own viewport intersection: the
 * raw `IntersectionObserverEntry`, not `InView`'s collapsed in/out boolean.
 * `Sticky` needs `entry.boundingClientRect.y` to tell "scrolled above the
 * viewport" apart from "scrolled below it", which the collapsed boolean
 * cannot express.
 *
 * @link https://ui.studiometa.dev/reference/items/Sentinel/
 */
export class Sentinel<T extends BaseProps = BaseProps> extends withInView(Base, {
  threshold: [0, 1],
})<SentinelProps & T> {
  static config: BaseConfig = { name: 'Sentinel' };

  intersected(props: InViewProps): void {
    this.$emit('intersected', props);
  }
}

/**
 * The main component of a family is also its default export, which is how its
 * own subpath (`@studiometa/ui/Sentinel`) has always exposed it. Family members
 * and sub-components carry only their named export.
 */
export default Sentinel;
